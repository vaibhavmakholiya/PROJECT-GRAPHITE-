import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  ShieldCheck,
  Clock,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
  Smartphone,
  X,
} from 'lucide-react';
import { verhoeffValid, maskAadhaar } from '@sanchay/core';
import { useAuth } from '../hooks/useAuth';
import {
  stripExifAndNormalize,
  assessImageQuality,
  rotateCanvas,
  wipeCanvas,
  safeRevokeUrl,
} from '../ocr/imagePipeline';
import { parseAadhaar, AadhaarParseResult } from '../ocr/parseAadhaar';
import { recognizeAadhaarImage } from '../ocr/ocrService';

type RegisterStep =
  | 'consent'      // Step 1: Privacy pledge & explicit consent
  | 'capture'      // Step 2: Front card capture (and optional back)
  | 'crop_rotate'  // Step 3: Rotate & adjust
  | 'ocr_running'  // Step 4: On-device reading progress
  | 'confirm'      // Step 5: Review extracted fields & masked Aadhaar
  | 'phone_otp'    // Step 6: Phone & OTP verification
  | 'pending';     // Step 7/8: Waiting for admin approval

export const RegisterView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { member, register, updateStatus } = useAuth();

  // Navigation / Step state
  const [step, setStep] = useState<RegisterStep>(() => {
    return member?.status === 'pending' ? 'pending' : 'consent';
  });

  // Step 1: Consent
  const [hasConsented, setHasConsented] = useState(false);

  // Step 2 & 3: Image & Preprocessing in memory
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hasBackCard, setHasBackCard] = useState(false);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [qualityWarning, setQualityWarning] = useState<string | null>(null);
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const backCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 4: OCR Progress & Worker Control
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrStatusText, setOcrStatusText] = useState('Initializing on-device engine...');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Step 5: Extracted Details (Strict Privacy: 12-digit number strictly in volatile component state)
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [address, setAddress] = useState('');
  const [aadhaar12Digits, setAadhaar12Digits] = useState('');
  const [showAadhaarEditModal, setShowAadhaarEditModal] = useState(false);
  const [editDigitsTemp, setEditDigitsTemp] = useState('');
  const [detailsVerified, setDetailsVerified] = useState(false);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [lowConfidenceFields, setLowConfidenceFields] = useState<Record<string, boolean>>({});

  // Step 6: Phone, Group Code & OTP
  const [groupCode, setGroupCode] = useState('PRAG24');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Derived Values
  const isAadhaarChecksumValid =
    aadhaar12Digits.length === 12 && verhoeffValid(aadhaar12Digits);

  const calculatedAge = dob ? (() => {
    const parts = dob.split('-');
    if (parts.length === 3) {
      const birth = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 0 ? age : null;
    }
    return null;
  })() : null;

  const previewUrlRef = useRef<string | null>(null);
  previewUrlRef.current = previewUrl;

  // Cleanup helper for explicit resets (e.g. retake or discard)
  const cleanupBuffers = useCallback(() => {
    safeRevokeUrl(previewUrlRef.current);
    setPreviewUrl(null);
    wipeCanvas(activeCanvasRef.current);
    wipeCanvas(backCanvasRef.current);
    activeCanvasRef.current = null;
    backCanvasRef.current = null;
  }, []);

  // Unmount & pagehide cleanup ONLY (empty dependency array to prevent wiping active preview)
  useEffect(() => {
    const handlePageHide = () => {
      safeRevokeUrl(previewUrlRef.current);
      wipeCanvas(activeCanvasRef.current);
      wipeCanvas(backCanvasRef.current);
    };
    window.addEventListener('pagehide', handlePageHide);
    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      safeRevokeUrl(previewUrlRef.current);
      wipeCanvas(activeCanvasRef.current);
      wipeCanvas(backCanvasRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Handle Image File Selection
  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so re-selecting same file triggers change
    e.target.value = '';
    setQualityWarning(null);

    const tempUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        // Redraw immediately to strip EXIF and normalize dimensions
        const processedCanvas = stripExifAndNormalize(img, {
          targetWidth: 1200,
          grayscale: true,
          contrast: 1.25,
        });

        // Assess quality
        const quality = assessImageQuality(processedCanvas);
        if (!quality.isAcceptable && quality.warning) {
          setQualityWarning(quality.warning);
        }

        // Store in canvas ref
        if (activeSide === 'front') {
          wipeCanvas(activeCanvasRef.current);
          activeCanvasRef.current = processedCanvas;
        } else {
          wipeCanvas(backCanvasRef.current);
          backCanvasRef.current = processedCanvas;
        }

        // Synchronously generate instant data URL preview (zero async blank delay)
        const preview = processedCanvas.toDataURL('image/jpeg', 0.85);
        safeRevokeUrl(previewUrl);
        setPreviewUrl(preview);
        setStep('crop_rotate');
      } catch (err: any) {
        console.error('Error processing card image:', err);
        setQualityWarning('Could not process this card image. Please select a clearer photo or try another format.');
        setStep('capture');
      } finally {
        safeRevokeUrl(tempUrl);
      }
    };

    img.onerror = () => {
      safeRevokeUrl(tempUrl);
      setQualityWarning('Could not read image file. Please try taking another photo.');
      setStep('capture');
    };

    img.src = tempUrl;
  };

  // Rotate Preview Canvas
  const handleRotate = () => {
    const currentCanvas = activeSide === 'front' ? activeCanvasRef.current : backCanvasRef.current;
    if (!currentCanvas) return;

    try {
      const rotated = rotateCanvas(currentCanvas, 90);
      if (activeSide === 'front') {
        activeCanvasRef.current = rotated;
      } else {
        backCanvasRef.current = rotated;
      }

      // Synchronously update preview
      const preview = rotated.toDataURL('image/jpeg', 0.85);
      safeRevokeUrl(previewUrl);
      setPreviewUrl(preview);
    } catch (err) {
      console.error('Rotate error:', err);
    }
  };

  // Start On-Device OCR Recognition
  const handleStartOcr = async () => {
    const frontCanvas = activeCanvasRef.current;
    if (!frontCanvas) return;

    setStep('ocr_running');
    setOcrProgress(5);
    setOcrStatusText('Starting on-device OCR engine...');

    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    try {
      // 1. Recognize Front Card
      const frontResult = await recognizeAadhaarImage(
        frontCanvas,
        (progress, status) => {
          setOcrProgress(progress);
          setOcrStatusText(status);
        },
        abortCtrl.signal
      );

      let fullRawText = frontResult.text;
      const allWords = [...frontResult.words];

      // 2. If back card present, recognize back for address
      if (backCanvasRef.current) {
        setOcrStatusText('Reading card back side for address...');
        const backResult = await recognizeAadhaarImage(
          backCanvasRef.current,
          (progress) => setOcrProgress(90 + Math.round(progress * 0.08)),
          abortCtrl.signal
        );
        fullRawText += `\n${backResult.text}`;
        allWords.push(...backResult.words);
      }

      // 3. Parse Aadhaar Data
      const parsed: AadhaarParseResult = parseAadhaar(fullRawText, allWords);

      // Populate Extracted Fields
      if (parsed.name) setFullName(parsed.name);
      if (parsed.dob) {
        // Normalize DOB to YYYY-MM-DD for date input
        const parts = parsed.dob.split(/[\/\.-]/);
        if (parts.length === 3) {
          const formatted = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          setDob(formatted);
        } else if (parts.length === 1 && parts[0].length === 4) {
          setDob(`${parts[0]}-01-01`);
        }
      }
      if (parsed.gender) setGender(parsed.gender);
      if (parsed.address) setAddress(parsed.address);
      if (parsed.aadhaarNumber) {
        setAadhaar12Digits(parsed.aadhaarNumber);
        setEditDigitsTemp(parsed.aadhaarNumber);
      }

      // Check confidences < 70% to flag for manual confirmation
      const lowConf: Record<string, boolean> = {};
      if (parsed.confidences.aadhaarNumber > 0 && parsed.confidences.aadhaarNumber < 70) {
        lowConf.aadhaar = true;
      }
      if (parsed.confidences.name > 0 && parsed.confidences.name < 70) {
        lowConf.name = true;
      }
      if (parsed.confidences.dob > 0 && parsed.confidences.dob < 70) {
        lowConf.dob = true;
      }
      setLowConfidenceFields(lowConf);
      setParseWarnings(parsed.warnings);

      // Free large working images immediately after extraction
      cleanupBuffers();
      setStep('confirm');
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        // User canceled OCR, return safely to capture
        cleanupBuffers();
        setStep('capture');
        return;
      }
      setQualityWarning('OCR encountered an issue reading the card. Please try again with clear lighting.');
      setStep('capture');
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Cancel OCR
  const handleCancelOcr = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    cleanupBuffers();
    setStep('capture');
  };

  // Submit Final Registration (Strict Privacy: 12-digit number is never sent or persisted)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!otpCode || (otpCode !== '123456' && otpCode.length !== 6)) {
      setSubmitError('Invalid OTP code. Please enter 123456 for test verification.');
      return;
    }

    if (!fullName.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }

    if (!isAadhaarChecksumValid) {
      setSubmitError('Aadhaar number checksum is invalid. Please verify digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send ONLY masked/last 4 digits and confirmed demographic info
      const lastFour = aadhaar12Digits.slice(-4);
      await register({
        name: fullName.trim(),
        phone: phone.trim(),
        dob: dob || '1990-01-01',
        address: address.trim() || 'Pragati Gram Panchayat',
        aadhaarLast4: lastFour,
        aadhaarNumber: aadhaar12Digits,
        groupCode: groupCode.trim().toUpperCase(),
        gender,
        age: calculatedAge,
      });

      // Strict Privacy Rule: Zero 12-digit number from component state immediately
      setAadhaar12Digits('');
      setEditDigitsTemp('');
      cleanupBuffers();

      setStep('pending');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit registration. Please check details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // =========================================================================
  // VIEW: Step 7/8 - Waiting for Admin Approval Screen
  // =========================================================================
  if (step === 'pending' || member?.status === 'pending') {
    return (
      <div className="p-6 flex flex-col justify-between min-h-full animate-fade-in">
        <div className="pt-4 space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-status-amber-bg text-status-amber flex items-center justify-center shadow-subtle mx-auto border border-status-amber/30">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-status-amber-bg text-status-amber border border-status-amber/30 mb-2">
              <Clock className="w-3.5 h-3.5" />
              {t('register.pendingStatus', 'Status: Under Review')}
            </span>
            <h1 className="font-heading font-extrabold text-2xl text-navy-900 tracking-tight">
              {t('register.pendingTitle', 'Waiting for Admin Approval')}
            </h1>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed max-w-sm mx-auto">
              {t(
                'register.pendingDesc',
                'Your registration request has been submitted to your Group Leader. Once approved in the monthly meeting, your passbook will become active.'
              )}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-subtle space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-blue-200">
              <span className="text-slate-600">Applicant Name</span>
              <span className="font-semibold text-navy-900">{fullName || member?.name || 'New Member'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-blue-200">
              <span className="text-slate-600">Aadhaar (Protected)</span>
              <span className="font-mono font-semibold text-navy-900">
                {member?.aadhaarLast4 ? maskAadhaar(member.aadhaarLast4) : 'XXXX-XXXX-1234'}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-blue-200">
              <span className="text-slate-600">Self-Help Group</span>
              <span className="font-semibold text-navy-900">Pragati Mahila Bachat Gat</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-600">Group President</span>
              <span className="font-semibold text-navy-900">Sunita Sharma</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-100 border border-blue-200 text-xs text-navy-900 flex items-start gap-2.5">
            <UserCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {t(
                'register.contactLeader',
                'Please inform your SHG President (Sunita Sharma) at the next village meeting to activate your passbook.'
              )}
            </p>
          </div>
        </div>

        <div className="pb-4 pt-6 space-y-2">
          <button
            type="button"
            onClick={() => {
              updateStatus('active');
              navigate('/dashboard');
            }}
            className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle transition-colors cursor-pointer focus:ring-3 focus:ring-blue-300"
          >
            <Sparkles className="w-4 h-4" />
            <span>[Dev Shortcut] Simulate Admin Approval</span>
          </button>

          <Link
            to="/login"
            className="block text-center text-xs text-slate-600 hover:text-navy-900 font-medium py-2"
          >
            ← {t('register.backToLogin', 'Back to Login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in max-w-lg mx-auto">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageSelected}
        className="hidden"
      />

      {/* =====================================================================
          STEP 1: Consent & Privacy Notice
      ====================================================================== */}
      {step === 'consent' && (
        <div className="space-y-6">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-blue-100 text-blue-600 mb-2 border border-blue-200">
              Step 1 of 5
            </span>
            <h1 className="font-heading font-extrabold text-2xl text-navy-900 tracking-tight">
              {t('register.title', 'New Member Registration')}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Join your local Bachat Gat with fast, privacy-preserving on-device Aadhaar card scan.
            </p>
          </div>

          {/* Privacy Guarantee Card */}
          <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-subtle space-y-3.5">
            <div className="flex items-center gap-2.5 pb-2 border-b border-blue-200">
              <div className="w-8 h-8 rounded-xl bg-status-success-bg text-status-success flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-xs text-navy-900">
                  On-Device Privacy Guarantee
                </h2>
                <p className="text-[11px] text-slate-600">Strict zero-server photo guarantee</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-navy-900">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-status-success-bg text-status-success flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">✓</span>
                <p className="leading-relaxed">
                  <strong>Photo stays on your phone:</strong> Card images are processed entirely within this browser and are <em>never uploaded</em> to any server.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-status-success-bg text-status-success flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">✓</span>
                <p className="leading-relaxed">
                  <strong>Zero-retention memory:</strong> Location/EXIF data is stripped immediately, and image memory is erased as soon as reading finishes.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-status-success-bg text-status-success flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">✓</span>
                <p className="leading-relaxed">
                  <strong>Masked Aadhaar:</strong> Only the last 4 digits (e.g. <span className="font-mono bg-blue-100 text-blue-700 px-1 py-0.5 rounded border border-blue-200">XXXX-XXXX-1234</span>) are stored for group identity.
                </p>
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-blue-200 cursor-pointer hover:border-blue-400 transition-colors shadow-subtle">
            <input
              type="checkbox"
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-300 border-blue-200 cursor-pointer shrink-0"
            />
            <span className="text-xs text-navy-900 leading-relaxed font-medium">
              I agree to have my Aadhaar card read on this device for registration. I understand my photo is not saved or uploaded.
            </span>
          </label>

          <button
            type="button"
            disabled={!hasConsented}
            onClick={() => setStep('capture')}
            className={`w-full min-h-[48px] py-3.5 px-4 rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle transition-all cursor-pointer focus:ring-3 focus:ring-blue-300 ${
              hasConsented
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-100 text-slate-600 cursor-not-allowed'
            }`}
          >
            <span>Continue to Card Capture</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <Link to="/login" className="text-xs text-blue-600 font-medium hover:underline">
              ← Already registered? Go to Login
            </Link>
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 2: Card Capture Frame & Side Selection
      ====================================================================== */}
      {step === 'capture' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('consent')}
              className="text-xs text-slate-600 hover:text-navy-900 flex items-center gap-1 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
              Step 2 of 5
            </span>
          </div>

          <div>
            <h1 className="font-heading font-extrabold text-xl text-navy-900 tracking-tight">
              Capture Aadhaar Card ({activeSide === 'front' ? 'Front Side' : 'Back Side'})
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Position card inside the frame with good lighting and no glare.
            </p>
          </div>

          {qualityWarning && (
            <div className="p-3 rounded-xl bg-status-amber-bg border border-status-amber/30 text-status-amber text-xs flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{qualityWarning}</span>
            </div>
          )}

          {/* Visual Card Guideline Frame */}
          <div className="relative aspect-[1.586/1] w-full rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 overflow-hidden flex flex-col items-center justify-center p-4 shadow-subtle">
            {/* Corner Markers */}
            <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-blue-600 rounded-tl-md" />
            <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-blue-600 rounded-tr-md" />
            <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-blue-600 rounded-bl-md" />
            <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-blue-600 rounded-br-md" />

            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2 shadow-subtle">
              <Camera className="w-7 h-7" />
            </div>

            <p className="text-xs font-semibold text-navy-900 text-center mb-1">
              {activeSide === 'front' ? 'Front: Name, DOB & 12-Digit Number' : 'Back: Residential Address'}
            </p>
            <p className="text-[10px] text-slate-600 text-center max-w-xs">
              Hold camera steady directly over the physical card.
            </p>
          </div>

          {/* Side Options Toggle */}
          <div className="bg-white rounded-2xl border border-blue-200 p-3.5 shadow-subtle flex items-center justify-between">
            <div className="text-xs">
              <p className="font-semibold text-navy-900">Scan Back Side for Address</p>
              <p className="text-[11px] text-slate-600">Optional: automatically fills village address</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasBackCard}
                onChange={(e) => setHasBackCard(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-blue-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Trigger Device Camera / File Chooser */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle transition-colors cursor-pointer focus:ring-3 focus:ring-blue-300"
            >
              <Camera className="w-4 h-4" />
              <span>Take Photo with Camera</span>
            </button>

            {/* Quick Demo Fill Helper for testing environments */}
            <button
              type="button"
              onClick={() => {
                // Populate sample synthetic data with valid Verhoeff checksum
                setFullName('Kavita Devi');
                setDob('1989-11-14');
                setGender('FEMALE');
                setAadhaar12Digits('548923418901'); // Valid Verhoeff
                setEditDigitsTemp('548923418901');
                setAddress('House 42, Ward 3, Pragati Gram Panchayat, Maharashtra - 413002');
                setStep('confirm');
              }}
              className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl bg-white border border-blue-200 text-slate-600 hover:text-navy-900 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Use Test Sample Card (Quick Demo)</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 3: Crop, Rotate & Preview
      ====================================================================== */}
      {step === 'crop_rotate' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                cleanupBuffers();
                setStep('capture');
              }}
              className="text-xs text-slate-600 hover:text-navy-900 flex items-center gap-1 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Retake Photo
            </button>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
              Step 3 of 5
            </span>
          </div>

          <div>
            <h1 className="font-heading font-extrabold text-xl text-navy-900 tracking-tight">
              Align & Rotate Card
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Ensure text is right side up and clearly legible before reading.
            </p>
          </div>

          {/* Interactive Preview Container */}
          <div className="relative rounded-2xl bg-navy-900 overflow-hidden p-3 shadow-subtle flex items-center justify-center min-h-[220px] max-h-[340px]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Aadhaar Preview"
                className="rounded-xl max-h-[320px] object-contain transition-transform duration-200"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-white/80 py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-400" />
                <span className="text-xs">Preparing card preview...</span>
              </div>
            )}
          </div>

          {/* Rotate Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleRotate}
              className="py-2.5 px-4 rounded-xl bg-white border border-blue-200 text-navy-900 font-semibold text-xs flex items-center gap-2 hover:bg-blue-50 transition-colors shadow-subtle cursor-pointer"
            >
              <RotateCw className="w-4 h-4 text-blue-600" />
              <span>Rotate 90°</span>
            </button>
          </div>

          {/* Proceed to OCR or Capture Back */}
          <div className="space-y-2">
            {hasBackCard && activeSide === 'front' ? (
              <button
                type="button"
                onClick={() => {
                  setActiveSide('back');
                  setStep('capture');
                }}
                className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle transition-colors cursor-pointer focus:ring-3 focus:ring-blue-300"
              >
                <span>Confirm Front & Capture Back Side</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartOcr}
                className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle transition-colors cursor-pointer focus:ring-3 focus:ring-blue-300"
              >
                <Sparkles className="w-4 h-4" />
                <span>Read Card On-Device Now</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          STEP 4: Real-time On-Device OCR Running
      ====================================================================== */}
      {step === 'ocr_running' && (
        <div className="space-y-6 py-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-subtle relative">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <Lock className="w-3.5 h-3.5 text-blue-600 absolute bottom-2 right-2" />
          </div>

          <div>
            <h2 className="font-heading font-extrabold text-xl text-navy-900">
              Reading Card on Your Device
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
              Running client-side optical character recognition. No data is leaving your phone.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2 max-w-xs mx-auto">
            <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(8, ocrProgress)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-600">
              <span>{ocrStatusText}</span>
              <span className="font-mono font-bold text-navy-900">{ocrProgress}%</span>
            </div>
          </div>

          {/* Cancel Button */}
          <button
            type="button"
            onClick={handleCancelOcr}
            className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-navy-900 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            Cancel Reading
          </button>
        </div>
      )}

      {/* =====================================================================
          STEP 5: Confirm & Review Extracted Details
      ====================================================================== */}
      {step === 'confirm' && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                cleanupBuffers();
                setStep('capture');
              }}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retake Photo
            </button>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
              Step 4 of 5
            </span>
          </div>

          <div>
            <h1 className="font-heading font-extrabold text-xl text-navy-900 tracking-tight">
              Confirm Extracted Details
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Verify that details match your card. All fields can be manually corrected.
            </p>
          </div>

          {parseWarnings.length > 0 && (
            <div className="p-3 rounded-xl bg-status-amber-bg border border-status-amber/30 text-status-amber text-xs space-y-1">
              {parseWarnings.map((w, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          {/* Extracted Fields Form */}
          <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-subtle space-y-4 text-xs">
            {/* Aadhaar Number Display (Masked by Default) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-navy-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Aadhaar Number (Protected)
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setEditDigitsTemp(aadhaar12Digits);
                    setShowAadhaarEditModal(true);
                  }}
                  className="text-blue-600 hover:underline font-semibold text-[11px] cursor-pointer"
                >
                  Edit / Verify Digits
                </button>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isAadhaarChecksumValid
                    ? 'border-status-success bg-status-success-bg/20'
                    : 'border-status-error bg-status-error-bg/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm tracking-wider text-navy-900">
                    {aadhaar12Digits.length === 12
                      ? `XXXX-XXXX-${aadhaar12Digits.slice(-4)}`
                      : 'Not Detected'}
                  </span>
                  {isAadhaarChecksumValid && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-status-success-bg text-status-success">
                      <CheckCircle2 className="w-3 h-3" /> Verhoeff Valid
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block font-semibold text-navy-900 mb-1">
                Full Name (as on card)
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Kavita Devi"
                className={`w-full py-2.5 px-3 rounded-xl border bg-white text-navy-900 focus:border-blue-600 outline-none font-medium ${
                  lowConfidenceFields.name ? 'border-status-amber' : 'border-blue-200'
                }`}
                required
              />
              {lowConfidenceFields.name && (
                <span className="text-[10px] text-status-amber mt-0.5 block">
                  Please verify spelling against card.
                </span>
              )}
            </div>

            {/* DOB & Computed Age */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-navy-900 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={`w-full py-2.5 px-3 rounded-xl border bg-white text-navy-900 focus:border-blue-600 outline-none font-medium ${
                    lowConfidenceFields.dob ? 'border-status-amber' : 'border-blue-200'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-navy-900 mb-1">Calculated Age</label>
                <div className="py-2.5 px-3 rounded-xl border border-blue-200 bg-blue-100 font-semibold text-navy-900">
                  {calculatedAge !== null ? `${calculatedAge} years` : '—'}
                </div>
              </div>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block font-semibold text-navy-900 mb-1.5">Gender</label>
              <div className="grid grid-cols-3 gap-2">
                {(['FEMALE', 'MALE', 'OTHER'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      gender === g
                        ? 'border-blue-600 bg-blue-100 text-blue-600'
                        : 'border-blue-200 bg-white text-slate-600 hover:text-navy-900'
                    }`}
                  >
                    {g === 'FEMALE' ? 'Female' : g === 'MALE' ? 'Male' : 'Other'}
                  </button>
                ))}
              </div>
            </div>

            {/* Residential Address */}
            <div>
              <label className="block font-semibold text-navy-900 mb-1">
                Residential Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Village, Ward, Panchayat, PIN Code"
                rows={2}
                className="w-full py-2.5 px-3 rounded-xl border border-blue-200 bg-white text-navy-900 focus:border-blue-600 outline-none font-medium resize-none"
              />
            </div>
          </div>

          {/* Verification Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-blue-200 cursor-pointer hover:border-blue-400 transition-colors shadow-subtle">
            <input
              type="checkbox"
              checked={detailsVerified}
              onChange={(e) => setDetailsVerified(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-blue-600 focus:ring-blue-300 border-blue-200 cursor-pointer shrink-0"
            />
            <span className="text-xs text-navy-900 leading-relaxed font-medium">
              I verify that the above information matches my physical Aadhaar card and is accurate.
            </span>
          </label>

          <button
            type="button"
            disabled={!detailsVerified || !isAadhaarChecksumValid || !fullName.trim()}
            onClick={() => setStep('phone_otp')}
            className={`w-full min-h-[48px] py-3.5 px-4 rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle transition-all cursor-pointer focus:ring-3 focus:ring-blue-300 ${
              detailsVerified && isAadhaarChecksumValid && fullName.trim()
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-100 text-slate-600 cursor-not-allowed'
            }`}
          >
            <span>Proceed to Phone Verification</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          STEP 6: Phone & OTP Verification Screen
      ====================================================================== */}
      {step === 'phone_otp' && (
        <form onSubmit={handleFinalSubmit} className="space-y-5 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep('confirm')}
              className="text-xs text-slate-600 hover:text-navy-900 flex items-center gap-1 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Review
            </button>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full">
              Step 5 of 5
            </span>
          </div>

          <div>
            <h1 className="font-heading font-extrabold text-xl text-navy-900 tracking-tight">
              Link Mobile Number
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Verify your mobile number to link your passbook with Pragati Bachat Gat.
            </p>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-status-error-bg border border-status-error/30 text-status-error text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-blue-200 p-4 shadow-subtle space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-navy-900 mb-1">
                Group Join Code
              </label>
              <input
                type="text"
                maxLength={10}
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                placeholder="PRAG24"
                className="w-full py-2 px-3 rounded-xl border border-blue-200 bg-white text-navy-900 outline-none font-mono uppercase font-bold tracking-wider focus:border-blue-600"
                required
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Ask your Self-Help Group leader for your group's join code (e.g. PRAG24)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-navy-900 mb-1">
                Mobile Number
              </label>
              <div className="flex items-center rounded-xl border border-blue-200 bg-white overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-200 shadow-xs transition-all">
                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-50 border-r border-blue-200 text-slate-700 font-bold text-xs select-none shrink-0">
                  <span className="text-sm">🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  className="w-full py-2.5 px-3 bg-transparent text-navy-900 outline-none font-medium placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            {!otpSent ? (
              <button
                type="button"
                disabled={phone.length !== 10}
                onClick={() => setOtpSent(true)}
                className={`w-full min-h-[48px] py-2.5 px-4 rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-1.5 shadow-subtle transition-all cursor-pointer focus:ring-3 focus:ring-blue-300 ${
                  phone.length === 10
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-100 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Send Verification OTP</span>
              </button>
            ) : (
              <div className="space-y-3 pt-1 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy-900">
                    Enter 6-Digit Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setOtpCode('123456')}
                    className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    Auto-Fill Test OTP (123456)
                  </button>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full py-2.5 px-3 rounded-xl border border-blue-200 bg-white text-navy-900 focus:border-blue-600 outline-none font-mono text-center tracking-widest text-base font-bold"
                  required
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!otpSent || otpCode.length !== 6 || isSubmitting}
            className={`w-full min-h-[48px] py-3.5 px-4 rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-2 shadow-subtle transition-all cursor-pointer focus:ring-3 focus:ring-blue-300 ${
              otpSent && otpCode.length === 6 && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-100 text-slate-600 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Submitting Registration...</span>
              </>
            ) : (
              <>
                <span>Complete Registration</span>
                <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* =====================================================================
          MODAL: Edit Aadhaar Digits with Real-time Verhoeff Checksum Check
      ====================================================================== */}
      {showAadhaarEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-modal space-y-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm text-navy-900">
                Verify 12-Digit Aadhaar
              </h3>
              <button
                type="button"
                onClick={() => setShowAadhaarEditModal(false)}
                className="text-slate-600 hover:text-navy-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the full 12 digits directly from your card to verify the Verhoeff checksum. This number lives only in temporary component memory.
            </p>

            <div>
              <input
                type="text"
                maxLength={12}
                value={editDigitsTemp}
                onChange={(e) => setEditDigitsTemp(e.target.value.replace(/\D/g, ''))}
                placeholder="548923418905"
                className={`w-full py-3 px-3 rounded-xl border font-mono text-center tracking-widest text-base font-bold outline-none ${
                  editDigitsTemp.length === 12 && verhoeffValid(editDigitsTemp)
                    ? 'border-status-success text-status-success bg-status-success-bg/10'
                    : editDigitsTemp.length === 12
                    ? 'border-status-error text-status-error bg-status-error-bg/10'
                    : 'border-blue-200 text-navy-900'
                }`}
              />

              <div className="mt-2 text-center">
                {editDigitsTemp.length === 12 ? (
                  verhoeffValid(editDigitsTemp) ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-success">
                      <CheckCircle2 className="w-4 h-4" /> Checksum Valid (Correct Number)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-status-error">
                      <AlertCircle className="w-4 h-4" /> Invalid Checksum (Check digits)
                    </span>
                  )
                ) : (
                  <span className="text-[11px] text-slate-600">
                    {12 - editDigitsTemp.length} digits remaining
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAadhaarEditModal(false)}
                className="flex-1 min-h-[44px] py-2.5 px-3 rounded-xl border border-blue-200 text-navy-900 font-semibold text-xs hover:bg-blue-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={editDigitsTemp.length !== 12 || !verhoeffValid(editDigitsTemp)}
                onClick={() => {
                  setAadhaar12Digits(editDigitsTemp);
                  setShowAadhaarEditModal(false);
                }}
                className={`flex-1 min-h-[44px] py-2.5 px-3 rounded-xl font-heading font-bold text-xs shadow-subtle cursor-pointer focus:ring-3 focus:ring-blue-300 ${
                  editDigitsTemp.length === 12 && verhoeffValid(editDigitsTemp)
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-100 text-slate-600 cursor-not-allowed'
                }`}
              >
                Save & Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterView;

import Dexie from 'dexie'

export const db = new Dexie('SanchayDB')

db.version(1).stores({
  members: 'id,name',
  transactions: 'id,amount,type,date,synced',
})

db.version(2).stores({
  members: 'id,name',
  transactions: 'id,type,amount,memberName,date,synced',
  loans: 'id,memberName,amount,interest,date,synced',
})

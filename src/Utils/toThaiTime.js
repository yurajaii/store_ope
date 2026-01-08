export default function toThaiTime(dateString) {
  if (!dateString) return '-'

  return new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'narrow',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(dateString))
}

// const res = toThaiTime('2026-01-08T04:31:37.108Z')

// console.log(res)

import handler from '../lib/tasks.js'

// Vercel Serverless Function：/api/tasks
export default function (req, res) {
  return handler(req, res)
}

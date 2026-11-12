import 'dotenv/config'
import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tasksHandler from '../lib/tasks.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const app = express()

app.use(express.json())

app.all('/api/tasks', (req, res) => tasksHandler(req, res))

app.use(express.static(path.join(root, 'dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(root, 'dist', 'index.html'))
})

const port = Number(process.env.PORT || 3000)
app.listen(port, () => {
  console.log(`本地服务已启动：http://localhost:${port}`)
})

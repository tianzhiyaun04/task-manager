require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  SUPABASE_URL 或 SUPABASE_ANON_KEY 未配置');
}

const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// 获取任务列表（按创建时间倒序）
app.get('/api/tasks', async (req, res) => {
  try {
    const { priority } = req.query;
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (priority && priority !== '全部') {
      query = query.eq('priority', priority);
    }
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 添加任务
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, priority } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: '任务标题不能为空' });
    }
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title: title.trim(), priority: priority || '中' }])
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 切换完成状态
app.put('/api/tasks/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: task } = await supabase
      .from('tasks')
      .select('completed')
      .eq('id', id)
      .single();
    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', id)
      .select();
    if (error) throw error;
    res.json(data[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', supabase: !!supabase });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
});
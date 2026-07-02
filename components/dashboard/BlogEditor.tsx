'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Sparkles, Save, Globe, Eye, FileText, ChevronRight, CornerDownRight, 
  X, Check, Trash2, Code, Heading, Bold, Italic, Link2, Image as ImageIcon, Send, ArrowRightLeft 
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category: 'build_log' | 'tutorial' | 'opinion' | 'devlog';
  tags?: string[];
  cover_image?: string;
  status: 'draft' | 'published';
  published_at?: string;
}

interface BlogEditorProps {
  post: BlogPost;
}

const CATEGORIES = [
  { value: 'build_log', label: 'Build Log' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'opinion', label: 'Opinion' },
  { value: 'devlog', label: 'Devlog' }
];

export default function BlogEditor({ post }: BlogEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [excerpt, setExcerpt] = useState(post.excerpt || '');
  const [category, setCategory] = useState<BlogPost['category']>(post.category);
  const [tags, setTags] = useState<string[]>(post.tags || []);
  const [content, setContent] = useState(post.content);
  const [status, setStatus] = useState<BlogPost['status']>(post.status);
  
  // Tag input state
  const [newTagVal, setNewTagVal] = useState('');

  // Cross-posting status
  const [crossPostHashnode, setCrossPostHashnode] = useState(false);
  const [crossPostDevto, setCrossPostDevto] = useState(false);

  // Auto-save feedback indicators
  const [lastSaved, setLastSaved] = useState<string>('Not saved yet');
  const [isSaving, setIsSaving] = useState(false);

  // AI assistant states
  const [aiSelectedText, setAiSelectedText] = useState('');
  const [aiInstruction, setAiInstruction] = useState('improve');
  const [aiResult, setAiResult] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Auto-generate slug from title
  useEffect(() => {
    if (status === 'draft') {
      const generated = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  }, [title]);

  // Auto-save draft loop every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      handleSaveDraft(true);
    }, 30000);

    return () => clearInterval(timer);
  }, [title, slug, excerpt, category, tags, content]);

  const handleSaveDraft = async (isAuto = false) => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      const updateData = {
        title,
        slug,
        excerpt,
        category,
        tags,
        content,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', post.id);

      if (!error) {
        setLastSaved(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Auto-save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsSaving(true);
    try {
      const updateData = {
        title,
        slug,
        excerpt,
        category,
        tags,
        content,
        status: 'published' as const,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', post.id);

      if (!error) {
        setStatus('published');
        alert('Article published successfully!');
        router.push('/dashboard/blog');
      }
    } catch (err) {
      console.error('Publish failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Add tag inline
  const handleAddTag = () => {
    const tag = newTagVal.trim().replace(/[^a-zA-Z0-9]/g, '');
    if (tag && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
    }
    setNewTagVal('');
  };

  const handleRemoveTag = (t: string) => {
    setTags(prev => prev.filter(tag => tag !== t));
  };

  // MDX toolbar helpers to insert tags at cursor
  const insertToolbarElement = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    
    const insertion = prefix + selected + suffix;
    const nextContent = text.substring(0, start) + insertion + text.substring(end);
    setContent(nextContent);

    // Focus back and set selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  };

  // Capturing selected text for AI assistant
  const handleCaptureSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      setAiSelectedText(textarea.value.substring(start, end));
    } else {
      setAiSelectedText('');
    }
  };

  // Trigger Claude API to improve selected text block
  const handleAiCompletion = async () => {
    const textToProcess = aiSelectedText.trim() || content.trim();
    if (!textToProcess) return;

    setIsAiLoading(true);
    setAiResult('');

    try {
      // Craft structured prompt instruction
      let systemPrompt = '';
      if (aiInstruction === 'improve') {
        systemPrompt = `You are a technical editor. Rewrite the following paragraph to be clear, professional, and flow better. Keep markdown formatting intact: \n\n"${textToProcess}"`;
      } else if (aiInstruction === 'shorter') {
        systemPrompt = `Condense this paragraph to be shorter and more punchy: \n\n"${textToProcess}"`;
      } else if (aiInstruction === 'example') {
        systemPrompt = `Append a brief code example or contextual sample explaining this paragraph: \n\n"${textToProcess}"`;
      } else if (aiInstruction === 'excerpt') {
        systemPrompt = `Create a 2-sentence excerpt summarize key values from this post for SEO meta usage: \n\n"${textToProcess}"`;
      } else if (aiInstruction === 'tags') {
        systemPrompt = `List 4 relevant tech tags based on this text, separated by commas. Return ONLY the comma separated list. Text: \n\n"${textToProcess}"`;
      }

      const res = await fetch('/api/ask-hamid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: systemPrompt })
      });

      if (res.ok) {
        const data = await res.json();
        setAiResult(data.reply);
      } else {
        setAiResult('AI Assistant request failed. Verify Claude API key setup.');
      }
    } catch (err) {
      setAiResult('Connection error.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleApplyAiSuggestion = () => {
    if (!aiResult) return;

    if (aiInstruction === 'excerpt') {
      setExcerpt(aiResult);
    } else if (aiInstruction === 'tags') {
      const newTags = aiResult.split(',').map(t => t.trim().replace(/[^a-zA-Z0-9]/g, '')).filter(Boolean);
      setTags(prev => Array.from(new Set([...prev, ...newTags])));
    } else {
      // Replace active selection
      const textarea = textareaRef.current;
      if (textarea && aiSelectedText) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = content;
        const nextContent = text.substring(0, start) + aiResult + text.substring(end);
        setContent(nextContent);
      } else {
        // Append at end
        setContent(prev => prev + '\n\n' + aiResult);
      }
    }
    setAiResult('');
    setAiSelectedText('');
  };

  // Preview custom Markdown compiler
  const compilePreviewMarkdown = (text: string) => {
    const blocks = text.split('\n\n');
    return blocks.map((block, idx) => {
      const trimmed = block.trim();
      if (trimmed.startsWith('## ')) {
        return <h2 key={idx} className="text-sm font-bold text-white border-b border-zinc-900 pb-1 mt-4 mb-2">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={idx} className="text-xs font-bold text-white mt-3 mb-1.5">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith('```')) {
        const lines = trimmed.split('\n');
        return (
          <pre key={idx} className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-900 text-[10px] text-purple-400 font-mono my-3 overflow-x-auto">
            {lines.slice(1, -1).join('\n')}
          </pre>
        );
      }
      if (trimmed.startsWith('> [!NOTE]') || trimmed.startsWith('> [!TIP]') || trimmed.startsWith('> [!WARNING]')) {
        return (
          <div key={idx} className="p-3 my-3 bg-purple-950/20 border border-purple-500/20 rounded text-[10px] text-purple-300">
            {trimmed.split('\n').slice(1).join(' ')}
          </div>
        );
      }
      return <p key={idx} className="text-zinc-400 text-[11px] leading-relaxed mb-3">{trimmed}</p>;
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] select-none">
      
      {/* -------------------- WORKSPACE EDIT AREA (Split Pane) -------------------- */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-6 overflow-hidden">
        
        {/* Editor panel left block */}
        <div className="xl:col-span-8 flex flex-col h-full space-y-4 overflow-y-auto pr-2">
          
          {/* Metadata attributes input fields */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-white dark:bg-[#141414] border border-[#e5e5e5] dark:border-[#262626] text-xs font-semibold text-zinc-500">
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Article Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2 px-3 text-zinc-800 dark:text-zinc-100 outline-none focus:border-purple-500/30 font-bold"
                placeholder="Writing Title..."
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">URL Slug path</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={status === 'published'}
                className="w-full mt-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2 px-3 text-zinc-800 dark:text-zinc-100 outline-none disabled:opacity-50"
                placeholder="auto-generated-slug"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Category Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BlogPost['category'])}
                className="w-full mt-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2 px-3 text-zinc-700 dark:text-zinc-200 outline-none"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">SEO Meta Description Excerpt</label>
              <input
                type="text"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full mt-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-2 px-3 text-zinc-800 dark:text-zinc-100 outline-none focus:border-purple-500/30"
                placeholder="2-sentence excerpt summarizing post content..."
              />
            </div>

            {/* Tags Cloud Selector */}
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Article Tags</label>
              <div className="flex flex-wrap gap-1.5 items-center">
                {tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide bg-purple-950/20 text-purple-400 border border-purple-500/10 px-2.5 py-0.5 rounded-md">
                    <span>{t}</span>
                    <button type="button" onClick={() => handleRemoveTag(t)} className="hover:text-white">×</button>
                  </span>
                ))}
                
                <div className="flex gap-1.5 items-center ml-2">
                  <input
                    type="text"
                    value={newTagVal}
                    onChange={(e) => setNewTagVal(e.target.value)}
                    placeholder="Add..."
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="w-20 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-900 py-0.5 px-2 text-[10px] text-zinc-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="text-[10px] bg-purple-600 hover:bg-purple-500 text-white font-bold px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* MDX Content Workspace Editor */}
          <div className="flex-1 flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] overflow-hidden text-xs font-semibold text-zinc-500">
            {/* Toolbar */}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 px-4 py-2 border-b border-zinc-250 dark:border-zinc-800/80">
              <button onClick={() => insertToolbarElement('**', '**')} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer" title="Bold"><Bold className="h-4 w-4" /></button>
              <button onClick={() => insertToolbarElement('*', '*')} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer" title="Italic"><Italic className="h-4 w-4" /></button>
              <button onClick={() => insertToolbarElement('## ')} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer" title="Heading"><Heading className="h-4 w-4" /></button>
              <button onClick={() => insertToolbarElement('```typescript\n', '\n```')} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer" title="Code block"><Code className="h-4 w-4" /></button>
              <button onClick={() => insertToolbarElement('[', '](url)')} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer" title="Link"><Link2 className="h-4 w-4" /></button>
              
              <div className="border-l border-zinc-250 dark:border-zinc-800 h-5 mx-2" />
              
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                Markdown Editor
              </span>
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onMouseUp={handleCaptureSelection}
              onKeyUp={handleCaptureSelection}
              placeholder="Write raw markdown / MDX content here..."
              className="flex-1 w-full bg-transparent border-none outline-none resize-none p-5 font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed placeholder-zinc-600"
            />
          </div>

        </div>

        {/* Dynamic Preview Right Sidebar Panel */}
        <div className="xl:col-span-4 flex flex-col h-full space-y-4 overflow-hidden border-l border-[#e5e5e5] dark:border-[#262626] pl-4">
          
          {/* Section 1: AI Writing Assistant */}
          <div className="rounded-xl border border-purple-500/10 bg-purple-950/5 p-4 flex flex-col space-y-3.5 text-xs font-semibold text-zinc-500">
            <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              <span>AI Writing Assistant</span>
            </h3>

            <div>
              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Instruction Action</label>
              <select
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                className="w-full mt-1 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-1.5 px-2 text-zinc-700 dark:text-zinc-200 outline-none"
              >
                <option value="improve">Improve Selected Paragraph</option>
                <option value="shorter">Make Paragraph Shorter</option>
                <option value="example">Add Code Example</option>
                <option value="excerpt">Generate SEO Excerpt</option>
                <option value="tags">Suggest Relevant Tags</option>
              </select>
            </div>

            {aiSelectedText && (
              <div className="p-2 bg-zinc-950 border border-zinc-900 rounded font-mono text-[9px] text-zinc-400 line-clamp-3">
                Selected: "{aiSelectedText}"
              </div>
            )}

            <button
              onClick={handleAiCompletion}
              disabled={isAiLoading || (!aiSelectedText && !content)}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isAiLoading ? 'Claude rewriting...' : 'Ask Claude'}</span>
            </button>

            {aiResult && (
              <div className="space-y-2 pt-2 border-t border-zinc-200/10 dark:border-zinc-800/80">
                <div className="p-3 bg-zinc-950/80 border border-purple-500/10 rounded-lg text-[10px] text-zinc-300 font-normal leading-relaxed max-h-36 overflow-y-auto">
                  {aiResult}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleApplyAiSuggestion}
                    className="flex-1 bg-purple-950/30 text-purple-400 hover:bg-purple-600 hover:text-white border border-purple-500/20 text-[9px] font-bold uppercase tracking-wider py-1 rounded transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    <span>Apply Suggestion</span>
                  </button>
                  <button
                    onClick={() => setAiResult('')}
                    className="p-1 rounded hover:bg-zinc-850 text-zinc-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Split Live Preview */}
          <div className="flex-1 flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141414] overflow-hidden text-xs font-semibold text-zinc-500">
            <div className="bg-zinc-50 dark:bg-zinc-950 px-4 py-2 border-b border-zinc-250 dark:border-zinc-800/80 text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-zinc-500" />
              <span>Live Render Preview</span>
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto font-sans bg-zinc-900/5 select-text">
              <h1 className="text-base font-black text-white leading-tight mb-4">{title || 'Untitled Article'}</h1>
              <div className="space-y-2">
                {compilePreviewMarkdown(content)}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* -------------------- FOOTER PUBLISHING BAR -------------------- */}
      <footer className="h-14 shrink-0 mt-4 border-t border-zinc-250 dark:border-zinc-800/80 bg-white dark:bg-[#141414] flex items-center justify-between px-6 -mx-8 -mb-8 text-xs font-semibold text-zinc-500">
        
        {/* Autosave status indicator */}
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${isSaving ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span className="text-[10px] text-zinc-400">
            {isSaving ? 'Saving draft...' : `Auto-saved at: ${lastSaved}`}
          </span>
        </div>

        {/* Cross-posting toggles & Actions */}
        <div className="flex items-center gap-6">
          <div className="flex gap-4 items-center">
            {/* Hashnode toggle */}
            <label className="flex items-center gap-2 text-[10px] text-zinc-400 hover:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={crossPostHashnode}
                onChange={(e) => setCrossPostHashnode(e.target.checked)}
                className="rounded border-zinc-800 accent-purple-600 bg-zinc-950"
              />
              <span>Dev.to</span>
            </label>
            
            {/* Dev.to toggle */}
            <label className="flex items-center gap-2 text-[10px] text-zinc-400 hover:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={crossPostDevto}
                onChange={(e) => setCrossPostDevto(e.target.checked)}
                className="rounded border-zinc-800 accent-purple-600 bg-zinc-950"
              />
              <span>Hashnode</span>
            </label>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleSaveDraft(false)}
              className="py-2 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-zinc-800 text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl transition-colors cursor-pointer"
            >
              Publish Article
            </button>
          </div>
        </div>

      </footer>

    </div>
  );
}

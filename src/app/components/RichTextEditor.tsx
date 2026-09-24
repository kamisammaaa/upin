'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Eye,
  PenLine,
  Loader2
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import MathFormulaModal from '@/app/components/MathFormulaModal';
import MathRenderer from '@/app/components/MathRenderer';

async function uploadImageFile(file: File): Promise<string | null> {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();
    if (result.success && result.url) {
      return result.url;
    }
  } catch (error) {
    console.error('Terjadi kesalahan saat mengupload gambar:', error);
  }
  return null;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface MenuBarProps {
  editor: Editor | null;
  onOpenMathModal: () => void;
  isPreviewing: boolean;
  onTogglePreview: () => void;
}

const MenuBar = ({ editor, onOpenMathModal, isPreviewing, onTogglePreview }: MenuBarProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (!editor) {
    return null;
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const url = await uploadImageFile(file);
    setIsUploading(false);

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    } else {
      alert('Gagal mengupload gambar');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="border-b border-gray-200 bg-gray-50 flex flex-wrap items-center gap-1 p-2 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('bold') ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('italic') ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('underline') ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Underline"
      >
        <UnderlineIcon className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Align Left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Align Center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Align Right"
      >
        <AlignRight className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Justify"
      >
        <AlignJustify className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('bulletList') ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-200 transition ${editor.isActive('orderedList') ? 'bg-gray-300 text-gray-900' : 'text-gray-600'}`}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={`p-2 rounded hover:bg-gray-200 transition text-gray-600 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}
        title="Insert Image"
      >
        <ImageIcon className="w-4 h-4" />
      </button>
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
      />

      <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>

      {/* Tombol Rumus Matematika (KaTeX / LaTeX) */}
      <button
        type="button"
        onClick={onOpenMathModal}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold transition active:scale-95 shadow-xs"
        title="Sisipkan Rumus Matematika (LaTeX / KaTeX)"
      >
        <span className="font-serif font-bold text-sm leading-none">∑</span>
        <span>Rumus</span>
      </button>

      {/* Tombol Toggle Pratinjau Soal */}
      <button
        type="button"
        onClick={onTogglePreview}
        className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition ${
          isPreviewing
            ? 'bg-blue-600 text-white shadow-xs'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
        }`}
        title={isPreviewing ? 'Kembali ke mode editor' : 'Pratinjau tampilan soal dan rumus'}
      >
        {isPreviewing ? (
          <>
            <PenLine className="w-3.5 h-3.5" />
            <span>Edit</span>
          </>
        ) : (
          <>
            <Eye className="w-3.5 h-3.5" />
            <span>Pratinjau</span>
          </>
        )}
      </button>
    </div>
  );
};

export default function RichTextEditor({ value, onChange, className = '' }: RichTextEditorProps) {
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose max-w-none w-full px-4 py-3 outline-none min-h-[120px] text-gray-900 bg-white rounded-b-lg',
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              setIsUploading(true);
              uploadImageFile(file).then((url) => {
                setIsUploading(false);
                if (url) {
                  const { schema } = view.state;
                  const node = schema.nodes.image.create({ src: url });
                  const tr = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(tr);
                } else {
                  alert('Gagal mengunggah gambar dari clipboard.');
                }
              });
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            setIsUploading(true);
            uploadImageFile(file).then((url) => {
              setIsUploading(false);
              if (url) {
                const { schema } = view.state;
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                const node = schema.nodes.image.create({ src: url });
                let tr = view.state.tr;
                if (coordinates) {
                  tr = tr.insert(coordinates.pos, node);
                } else {
                  tr = tr.replaceSelectionWith(node);
                }
                view.dispatch(tr);
              } else {
                alert('Gagal mengunggah gambar yang di-drop.');
              }
            });
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Sync editor content if value changes from outside (e.g. form reset or initial load)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Only set content if different to avoid cursor jumps
      if (editor.getText() === '' && value) {
        editor.commands.setContent(value);
      }
    }
  }, [value, editor]);

  const handleInsertFormula = (formulaString: string) => {
    if (!editor) return;
    // Insert with space around for clean formatting
    editor.chain().focus().insertContent(` ${formulaString} `).run();
  };

  return (
    <div className={`relative border border-gray-300 rounded-lg flex flex-col focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all overflow-hidden ${className}`}>
      {isUploading && (
        <div className="absolute top-2 right-2 z-30 flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg shadow-lg animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Mengunggah & mengompres gambar...</span>
        </div>
      )}
      <MenuBar
        editor={editor}
        onOpenMathModal={() => setIsMathModalOpen(true)}
        isPreviewing={isPreviewing}
        onTogglePreview={() => setIsPreviewing(!isPreviewing)}
      />
      
      <div className="flex-1 overflow-y-auto max-h-[400px]">
        {isPreviewing ? (
          <div className="p-4 min-h-[120px] bg-white text-gray-900 prose max-w-none">
            {value ? (
              <MathRenderer content={value} />
            ) : (
              <p className="text-gray-400 italic text-sm">Belum ada konten untuk dipratinjau.</p>
            )}
          </div>
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>

      <MathFormulaModal
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
        onInsert={handleInsertFormula}
      />
    </div>
  );
}

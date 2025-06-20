'use client'

import { useState, useRef, useEffect, forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageIcon, FileTextIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
// @ts-ignore - O pacote não tem tipos
import getCaretCoordinates from 'textarea-caret-position'

interface Attachment {
  id: string
  type: 'image' | 'pdf'
  content: string
  description: string
}

interface ShortcutFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  attachments: Attachment[]
  className?: string
  onBlur?: () => void
  multiline?: boolean
  isFullscreen?: boolean
}

export const ShortcutField = forwardRef<HTMLInputElement | HTMLTextAreaElement, ShortcutFieldProps>(({
  value,
  onChange,
  placeholder,
  attachments,
  className,
  onBlur,
  multiline = false,
  isFullscreen = false
}, forwardedRef) => {
  const [isOpen, setIsOpen] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [currentWord, setCurrentWord] = useState('')
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  // Sincronizar a ref encaminhada com a ref interna
  useEffect(() => {
    if (!forwardedRef) return;
    
    if (typeof forwardedRef === 'function') {
      forwardedRef(inputRef.current);
    } else {
      forwardedRef.current = inputRef.current;
    }
  }, [forwardedRef]);

  // Função para calcular a posição do cursor manualmente
  const updatePopoverPosition = () => {
    if (!inputRef.current) return;
    
    // Se não estiver em tela cheia, posicionar abaixo do campo
    if (!isFullscreen) {
      const rect = inputRef.current.getBoundingClientRect();
      setPopoverPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      });
      return;
    }
    
    try {
      // Obter a posição do elemento input/textarea na página
      const inputRect = inputRef.current.getBoundingClientRect();
      
      // Criar um elemento temporário para calcular a posição
      const mirror = document.createElement('div');
      const style = window.getComputedStyle(inputRef.current);
      
      // Copiar os estilos relevantes
      mirror.style.width = style.width;
      mirror.style.padding = style.padding;
      mirror.style.border = style.border;
      mirror.style.fontFamily = style.fontFamily;
      mirror.style.fontSize = style.fontSize;
      mirror.style.fontWeight = style.fontWeight;
      mirror.style.lineHeight = style.lineHeight;
      mirror.style.whiteSpace = multiline ? 'pre-wrap' : 'pre';
      mirror.style.position = 'absolute';
      mirror.style.top = '0';
      mirror.style.left = '0';
      mirror.style.visibility = 'hidden';
      
      // Adicionar o texto até o cursor
      const textBeforeCursor = value.substring(0, cursorPosition);
      
      // Criar um span para marcar a posição do cursor
      const cursorSpan = document.createElement('span');
      cursorSpan.textContent = '|';
      
      // Adicionar texto e cursor ao espelho
      mirror.textContent = textBeforeCursor;
      mirror.appendChild(cursorSpan);
      
      // Adicionar ao DOM para calcular posições
      document.body.appendChild(mirror);
      
      // Obter a posição do cursor
      const cursorRect = cursorSpan.getBoundingClientRect();
      
      // Remover o elemento temporário
      document.body.removeChild(mirror);
      
      // Calcular a posição final
      const top = cursorRect.top - inputRect.top + inputRef.current.scrollTop;
      const left = cursorRect.left - inputRect.left + inputRef.current.scrollLeft;
      
      setPopoverPosition({
        top: inputRect.top + top + cursorSpan.offsetHeight + window.scrollY,
        left: inputRect.left + left + window.scrollX
      });
    } catch (error) {
      console.error('Erro ao calcular posição do cursor:', error);
      
      // Fallback: posicionar próximo ao input
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setPopoverPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        });
      }
    }
  };

  // Detectar quando o usuário digita # e capturar a posição do cursor
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    const cursorPos = e.target.selectionStart || 0
    setCursorPosition(cursorPos)

    // Encontrar a palavra atual (começando com #)
    const textBeforeCursor = newValue.substring(0, cursorPos)
    const lastHashIndex = textBeforeCursor.lastIndexOf('#')
    
    if (lastHashIndex !== -1 && !textBeforeCursor.substring(lastHashIndex).includes(' ')) {
      const word = textBeforeCursor.substring(lastHashIndex)
      setCurrentWord(word)
      setIsOpen(true)
      
      // Atualizar a posição do popover após o DOM ser atualizado
      setTimeout(updatePopoverPosition, 0);
    } else {
      setIsOpen(false)
    }
  }

  // Inserir o atalho selecionado no texto
  const handleSelectShortcut = (shortcut: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (inputRef.current) {
      const beforeCursor = value.substring(0, cursorPosition - currentWord.length)
      const afterCursor = value.substring(cursorPosition)
      
      // Formatar o atalho: remover o # inicial, colocar em maiúsculo e envolver em colchetes
      const formattedShortcut = `[${shortcut.replace('#', '').toUpperCase()}]`
      
      const newValue = beforeCursor + formattedShortcut + afterCursor
      onChange(newValue)
      
      // Fechar o popover e resetar o estado
      setIsOpen(false)
      setCurrentWord('')
      
      // Focar o campo e posicionar o cursor após o atalho inserido
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
          const newCursorPos = beforeCursor.length + formattedShortcut.length
          inputRef.current.selectionStart = newCursorPos
          inputRef.current.selectionEnd = newCursorPos
        }
      }, 0)
    }
  }

  // Filtrar atalhos com base na entrada atual e remover duplicatas
  const filteredShortcuts = attachments
    .filter(att => att && att.description && att.description.toLowerCase().includes((currentWord || '').toLowerCase()))
    // Remover duplicatas baseadas na descrição (mantém apenas o primeiro de cada)
    .filter((att, index, self) => 
      index === self.findIndex((t) => t.description === att.description)
    );

  // Fechar o popover quando clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Atualizar posição quando o textarea é rolado ou redimensionado
  useEffect(() => {
    if (!inputRef.current || !isOpen || !isFullscreen) return;
    
    const handleScroll = updatePopoverPosition;
    const handleResize = updatePopoverPosition;
    
    inputRef.current.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    return () => {
      inputRef.current?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, isFullscreen]);

  // Atualizar posição quando o cursor se move
  useEffect(() => {
    if (!isOpen || !isFullscreen) return;
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
        if (inputRef.current) {
          setCursorPosition(inputRef.current.selectionStart || 0);
          updatePopoverPosition();
        }
      }
    };
    
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [isOpen, isFullscreen]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {multiline ? (
        <Textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "shortcut-field text-base md:text-sm",
            className
          )}
          onBlur={onBlur}
          onClick={() => {
            if (isOpen && inputRef.current && isFullscreen) {
              setCursorPosition(inputRef.current.selectionStart || 0);
              updatePopoverPosition();
            }
          }}
        />
      ) : (
        <Input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "shortcut-field text-base md:text-sm",
            className
          )}
          onBlur={onBlur}
          onClick={() => {
            if (isOpen && inputRef.current && isFullscreen) {
              setCursorPosition(inputRef.current.selectionStart || 0);
              updatePopoverPosition();
            }
          }}
        />
      )}
      
      {isOpen && currentWord.startsWith('#') && filteredShortcuts.length > 0 && (
        <div 
          ref={popoverRef}
          className={cn(
            "z-50 w-[250px] bg-popover rounded-md border shadow-md",
            isFullscreen ? "fixed" : "absolute top-full left-0 mt-1"
          )}
          style={isFullscreen ? {
            top: `${popoverPosition.top}px`,
            left: `${popoverPosition.left}px`
          } : {}}
        >
          <div className="p-1">
            <p className="px-2 py-1 text-xs font-medium text-muted-foreground">
              Atalhos disponíveis
            </p>
            <div className="max-h-[200px] overflow-y-auto">
              {filteredShortcuts.map((att) => (
                <button
                  key={`${att.id || ''}-${att.description}`}
                  className="flex items-center w-full px-2 py-1.5 text-sm rounded hover:bg-accent text-foreground"
                  onClick={(e) => handleSelectShortcut(att.description, e)}
                  type="button"
                >
                  {att.type === 'image' ? (
                    <ImageIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                  ) : (
                    <FileTextIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                  )}
                  <span className="font-medium text-primary">{att.description}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

ShortcutField.displayName = 'ShortcutField' 
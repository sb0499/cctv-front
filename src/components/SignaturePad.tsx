import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onClear: () => void;
}

export default function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const canvas = sigCanvas.current?.getCanvas();
    if (!canvas || !canvas.parentElement) return;

    const parent = canvas.parentElement;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        // Solo redimensionar si el contenedor tiene un ancho real y visible
        if (width > 0) {
          const temp = sigCanvas.current?.isEmpty() ? null : sigCanvas.current?.toDataURL();
          
          // Establecer dimensiones reales del buffer de dibujo
          canvas.width = width;
          canvas.height = height || 192;
          
          sigCanvas.current?.clear();
          if (temp) {
            sigCanvas.current?.fromDataURL(temp);
          }
        }
      }
    });

    resizeObserver.observe(parent);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const clear = () => {
    sigCanvas.current?.clear();
    onClear();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) {
      return;
    }
    const canvas = sigCanvas.current?.getCanvas();
    const dataURL = canvas?.toDataURL('image/png');
    if (dataURL) {
      onSave(dataURL);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border-2 border-slate-200 rounded-2xl bg-white overflow-hidden shadow-inner h-48 relative">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            className: 'signature-canvas w-full h-full cursor-crosshair'
          }}
          onEnd={save}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors text-xs font-bold cursor-pointer border border-rose-100"
        >
          Limpiar Firma
        </button>
      </div>
    </div>
  );
}

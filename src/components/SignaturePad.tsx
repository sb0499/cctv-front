import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onClear: () => void;
}

export default function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const handleResize = () => {
      const canvas = sigCanvas.current?.getCanvas();
      if (canvas && canvas.parentElement) {
        const temp = sigCanvas.current?.isEmpty() ? null : sigCanvas.current?.toDataURL();
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight || 192;
        sigCanvas.current?.clear();
        if (temp) {
          sigCanvas.current?.fromDataURL(temp);
        }
      }
    };

    // Wait a brief frame for parent element layout to calculate dimensions
    const timer = setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
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
    const dataURL = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
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

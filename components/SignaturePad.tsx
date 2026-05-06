'use client';

import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onClear: () => void;
}

export default function SignaturePad({ onSave, onClear }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);

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
      <div className="border-2 border-gray-300 rounded-lg bg-white overflow-hidden shadow-sm">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            className: 'signature-canvas w-full h-48 cursor-crosshair',
            style: { width: '100%', height: '192px' }
          }}
          onEnd={save}
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
        >
          Limpiar Firma
        </button>
      </div>
    </div>
  );
}

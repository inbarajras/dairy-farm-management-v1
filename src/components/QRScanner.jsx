import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, X, QrCode, AlertCircle } from 'lucide-react';

const QRScanner = ({ onScan, onClose, onError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    const startScanner = () => {
      try {
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        html5QrcodeScannerRef.current = new Html5QrcodeScanner(
          "qr-reader",
          config,
          false
        );

        html5QrcodeScannerRef.current.render(
          (decodedText, decodedResult) => {
            try {
              // Try to parse as JSON (our cow QR codes)
              const cowData = JSON.parse(decodedText);
              if (cowData.type === 'cow' && cowData.id) {
                onScan(cowData);
                stopScanner();
              } else {
                setError('Invalid QR code format. Please scan a cow QR code.');
              }
            } catch (e) {
              // If not JSON, treat as simple text
              setError('QR code does not contain valid cow data.');
            }
          },
          (error) => {
            // Handle scan errors silently - these are frequent during scanning
            console.log('QR scan error:', error);
          }
        );

        setIsScanning(true);
        setError(null);
      } catch (err) {
        setError('Failed to start camera. Please ensure camera permissions are granted.');
        onError && onError(err);
      }
    };

    const stopScanner = () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(err => {
          console.error('Failed to clear scanner:', err);
        });
        setIsScanning(false);
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      stopScanner();
    };
  }, [onScan, onError]);

  const handleClose = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(err => {
        console.error('Failed to clear scanner:', err);
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <QrCode className="mr-2" size={20} />
            Scan Cow QR Code
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
              <AlertCircle className="text-red-500 mr-2 mt-0.5" size={16} />
              <div>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-xs text-red-600 underline mt-1"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          <div className="text-center mb-4">
            <Camera className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm text-gray-600">
              Position the cow's QR code in front of your camera
            </p>
          </div>

          <div 
            id="qr-reader" 
            ref={scannerRef}
            className="w-full"
          ></div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>Make sure the QR code is well-lit and clearly visible</p>
            <p>The scanner will automatically detect and process cow QR codes</p>
          </div>
        </div>

        <div className="flex justify-end px-4 py-3 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

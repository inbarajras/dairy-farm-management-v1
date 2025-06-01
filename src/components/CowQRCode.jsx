import React, { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Download, Printer, QrCode, X } from 'lucide-react';

const CowQRCode = ({ cow, onClose }) => {
  const [size, setSize] = useState(256);
  const qrRef = useRef();

  // Generate QR code data with cow information
  const qrData = JSON.stringify({
    type: 'cow',
    id: cow.id,
    tagNumber: cow.tagNumber,
    name: cow.name,
    breed: cow.breed,
    timestamp: new Date().toISOString(),
    url: `${window.location.origin}/cow/${cow.id}`
  });

  // Download QR code as SVG
  const downloadQR = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    canvas.width = size;
    canvas.height = size;
    
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0);
      
      // Add cow info text below QR code
      ctx.fillStyle = 'black';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      
      const link = canvas.toDataURL('image/png');
      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.download = `cow-${cow.tagNumber}-qr.png`;
      anchor.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  // Print QR code
  const printQR = () => {
    const printWindow = window.open('', '_blank');
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${cow.name} (${cow.tagNumber})</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .qr-container { 
              display: inline-block; 
              border: 2px solid #333; 
              padding: 20px; 
              margin: 20px;
              border-radius: 10px;
            }
            .cow-info { 
              margin-top: 15px; 
              font-size: 14px; 
              font-weight: bold;
            }
            .instructions {
              margin-top: 20px;
              font-size: 12px;
              color: #666;
              max-width: 300px;
              margin-left: auto;
              margin-right: auto;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            ${svgData}
            <div class="cow-info">
              <div>${cow.name}</div>
              <div>Tag: ${cow.tagNumber}</div>
              <div>Breed: ${cow.breed}</div>
            </div>
            <div class="instructions">
              Scan this QR code to quickly record milk production or health events for this cow.
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <QrCode className="mr-2" size={20} />
            QR Code for {cow.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="text-center">
            <div 
              ref={qrRef}
              className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg"
            >
              <QRCode
                value={qrData}
                size={size}
                level="M"
                includeMargin={true}
              />
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Cow Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><span className="font-medium">Name:</span> {cow.name}</div>
                <div><span className="font-medium">Tag Number:</span> {cow.tagNumber}</div>
                <div><span className="font-medium">Breed:</span> {cow.breed}</div>
                <div><span className="font-medium">Age:</span> {cow.age}</div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Scan this QR code to quickly access this cow's records and log milk production or health events.
            </div>

            {/* Size Control */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR Code Size
              </label>
              <input
                type="range"
                min="128"
                max="512"
                step="32"
                value={size}
                onChange={(e) => setSize(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">{size}px</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={downloadQR}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download size={16} className="mr-2" />
            Download
          </button>
          <button
            onClick={printQR}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Printer size={16} className="mr-2" />
            Print
          </button>
          <button
            onClick={onClose}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CowQRCode;

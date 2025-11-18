import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '../services/api.js';

const ImageUpload = ({ currentImage, onImageChange, onImageRemove, maxSize = 5 * 1024 * 1024, label = 'Imagen de portada' }) => {
  // Keep a local preview state but sync with currentImage prop when it changes
  const [preview, setPreview] = useState(currentImage || null);
  useEffect(() => {
    setPreview(currentImage || null);
  }, [currentImage]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      // Validar tamaño (máx indicado por prop)
      if (file.size > maxSize) {
        alert(`La imagen es muy grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB permitido.`);
        return;
      }

      // Create an immediate dataURL preview for a snappy UX
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        setPreview(imageUrl);
      };
      reader.readAsDataURL(file);

      // Upload file to backend and set returned URL via onImageChange
      uploadImage(file)
        .then((data) => {
          if (data && data.url) {
            setPreview(data.url);
            onImageChange(data.url);
          } else {
            console.warn('Upload succeeded but no url returned', data);
            alert('Subida completada pero no se recibió la URL. Se usará la vista previa local.');
          }
        })
        .catch((err) => {
          console.error('Image upload error', err);
          alert('Error al subir imagen. Comprueba tu conexión e inténtalo de nuevo.');
        });
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onImageRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-upload-container">
      <label className="image-upload-label">{label}</label>
      
      {preview ? (
        <div className="image-preview">
          <img src={preview} alt="Vista previa" className="preview-image" />
          <div className="image-overlay">
            <button
              type="button"
              onClick={handleClick}
              className="image-action-btn"
              title="Cambiar imagen"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="image-action-btn"
              title="Quitar imagen"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`image-dropzone ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="dropzone-content">
            <ImageIcon size={32} className="dropzone-icon" />
            <p className="dropzone-text">
              Haz clic o arrastra una imagen aquí
            </p>
            <p className="dropzone-subtext">
              PNG, JPG, GIF hasta 5MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden-file-input"
      />
    </div>
  );
};

export default ImageUpload;
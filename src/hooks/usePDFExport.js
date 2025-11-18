import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from './useToast';

export const usePDFExport = () => {
  const { success, error: showError } = useToast();

  const exportGamesToPDF = async (games, reviews, stats, user) => {
    try {
      // If user has an avatar URL, try to fetch and convert to base64 for embedding
      let avatarDataUrl = null;
      if (user && user.avatarUrl) {
        try {
          const resp = await fetch(user.avatarUrl);
          if (resp.ok) {
            const contentType = resp.headers.get('content-type') || 'image/png';
            const arrayBuffer = await resp.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64Flag = btoa(binary);
            avatarDataUrl = `data:${contentType};base64,${base64Flag}`;
          }
        } catch (e) {
          console.warn('Failed to fetch avatar for PDF header', e);
        }
      }
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      // const pageHeight = doc.internal.pageSize.height; // Reserved for future pagination
      let yPosition = 30;

      // === ENCABEZADO CON ESTILO ===
      // Línea decorativa superior
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(2);
      doc.line(20, 15, pageWidth - 20, 15);
      
      // Título principal
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      // If we have an avatar, draw it left-aligned
      if (avatarDataUrl) {
        try {
          // Smaller, circular avatar on the left
          const imgSize = 22;
          const imgX = 20;
          const imgY = yPosition - 6;
          // Draw a white circle as background
          doc.setFillColor(255,255,255);
          doc.circle(imgX + imgSize/2, imgY + imgSize/2, imgSize/2, 'F');
          // Draw avatar image
          doc.addImage(avatarDataUrl, imgX, imgY, imgSize, imgSize);
        } catch (e) {
          // ignore image embedding failure
        }
      }
      // El título siempre centrado, el avatar a la izquierda
      doc.text('GAMETRACK REVOLUTION', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 8;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const ownerLabel = user ? (user.nombre || user.nickname || 'Mi Biblioteca') : 'Mi Biblioteca Personal de Videojuegos';
      doc.text(`${ownerLabel} — Biblioteca de videojuegos`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 10;
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generado el ${new Date().toLocaleDateString('es-ES')} - ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, yPosition, { align: 'center' });
      
      // Línea decorativa inferior
      yPosition += 8;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, pageWidth - 20, yPosition);
      
      yPosition += 20;
      
      // Restablecer color de texto para el contenido
      doc.setTextColor(0, 0, 0);

      // === ESTADÍSTICAS GENERALES ===
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('ESTADISTICAS GENERALES', 20, yPosition);
      
      // Línea decorativa debajo del título
      yPosition += 3;
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(1);
      doc.line(20, yPosition, 120, yPosition);
      
      // Restablecer color para el contenido
      doc.setTextColor(0, 0, 0);
      yPosition += 12;

      const statsData = [
        ['Total de juegos', stats.total.toString()],
        ['Juegos completados', stats.completed.toString()],
        ['Horas totales jugadas', `${stats.totalHours} horas`],
        ['Puntuación promedio', `${stats.avgRating}/5`],
        ['Porcentaje completado', `${Math.round((stats.completed / stats.total) * 100)}%`]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [['Métrica', 'Valor']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
        margin: { left: 20, right: 20 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 40, halign: 'center' }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 20;

      // === DISTRIBUCIÓN POR GÉNERO ===
      const genres = [...new Set(games.map(g => g.genero).filter(Boolean))];
      if (genres.length > 0) {
        // Verificar si necesitamos una nueva página
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 30;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('DISTRIBUCION POR GENERO', 20, yPosition);
        
        // Línea decorativa debajo del título
        yPosition += 3;
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(1);
        doc.line(20, yPosition, 120, yPosition);
        
        // Restablecer color
        doc.setTextColor(0, 0, 0);
        yPosition += 8;

        const genreData = genres.map(genre => {
          const count = games.filter(g => g.genero === genre).length;
          const percentage = Math.round((count / games.length) * 100);
          return [genre, count.toString(), `${percentage}%`];
        });

        autoTable(doc, {
          startY: yPosition,
          head: [['Género', 'Cantidad', 'Porcentaje']],
          body: genreData,
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 20, right: 20 }
        });

        yPosition = doc.lastAutoTable.finalY + 20;
      }

      // === DISTRIBUCIÓN POR PLATAFORMA ===
      const platforms = [...new Set(games.map(g => g.plataforma).filter(Boolean))];
      if (platforms.length > 0) {
        // Verificar si necesitamos una nueva página
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 30;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(245, 158, 11);
        doc.text('DISTRIBUCION POR PLATAFORMA', 20, yPosition);
        
        // Línea decorativa debajo del título
        yPosition += 3;
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(1);
        doc.line(20, yPosition, 140, yPosition);
        
        // Restablecer color
        doc.setTextColor(0, 0, 0);
        yPosition += 8;

        const platformData = platforms.map(platform => {
          const count = games.filter(g => g.plataforma === platform).length;
          const percentage = Math.round((count / games.length) * 100);
          return [platform, count.toString(), `${percentage}%`];
        });

        autoTable(doc, {
          startY: yPosition,
          head: [['Plataforma', 'Cantidad', 'Porcentaje']],
          body: platformData,
          theme: 'striped',
          headStyles: { fillColor: [245, 158, 11] },
          margin: { left: 20, right: 20 }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // === BIBLIOTECA DE JUEGOS ===
      // Verificar si necesitamos una nueva página
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 30;
      } else {
        yPosition += 20;
      }

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(37, 99, 235);
      doc.text('MI BIBLIOTECA DE JUEGOS', 20, yPosition);
      
      // Línea decorativa debajo del título
      yPosition += 3;
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(1);
      doc.line(20, yPosition, 130, yPosition);
      
      // Restablecer color
      doc.setTextColor(0, 0, 0);
      yPosition += 12;

      if (games.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.text('No hay juegos en tu biblioteca.', 20, yPosition);
      } else {
        const gameData = games.map(game => {
          const gameReviews = reviews.filter(r => String(r.juegoId) === String(game._id));
          const avgRating = gameReviews.length 
            ? `${(gameReviews.reduce((sum, r) => sum + r.puntuacion, 0) / gameReviews.length).toFixed(1)}/5`
            : 'Sin reseñas';
          
          return [
            game.titulo,
            game.genero || 'N/A',
            game.plataforma || 'N/A',
            game.añoLanzamiento?.toString() || 'N/A',
            game.completado ? 'Si' : 'No',
            avgRating
          ];
        });

        autoTable(doc, {
          startY: yPosition,
          head: [['Título', 'Género', 'Plataforma', 'Año', 'Completado']],
          body: gameData,
            theme: 'grid',
            // Neutral header styling for a homogeneous look
            headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255] },
            margin: { left: 20, right: 20 },
            // Let autoTable handle widths and wrap long text to avoid overflowing pages
            styles: {
              fontSize: 9,
              cellPadding: 3,
              overflow: 'linebreak',
              cellWidth: 'auto'
            },
          alternateRowStyles: {
            fillColor: [249, 250, 251]
          }
        });

        // === RESEÑAS DETALLADAS ===
        if (reviews.length > 0) {
          // Verificar si necesitamos una nueva página para las reseñas
          const currentY = doc.lastAutoTable.finalY + 20;
          if (currentY > 200) {
            doc.addPage();
            yPosition = 30;
          } else {
            yPosition = currentY;
          }

          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(16, 185, 129);
          doc.text('MIS RESENAS', 20, yPosition);
          
          // Línea decorativa debajo del título
          yPosition += 3;
          doc.setDrawColor(16, 185, 129);
          doc.setLineWidth(1);
          doc.line(20, yPosition, 90, yPosition);
          
          // Restablecer color
          doc.setTextColor(0, 0, 0);
          yPosition += 12;

          const reviewData = reviews.map(review => {
            // Determine game title similarly to ReviewsList: prefer mapped games, then populated juegoId, then fallback
            const gameObj = games.find(g => String(g._id) === String(review.juegoId));
            let title = null;
            if (gameObj && gameObj.titulo) title = gameObj.titulo;
            else if (review.juegoId && typeof review.juegoId === 'object' && (review.juegoId.titulo || review.juegoId.name)) title = review.juegoId.titulo || review.juegoId.name;
            else if (review.tituloJuego || review.nombreJuego) title = review.tituloJuego || review.nombreJuego;
            else title = '—';

            const rating = review.puntuacion ? `${review.puntuacion}/5` : 'N/A';
            return [
              title,
              rating,
              review.textoResena || 'Sin comentarios',
              (gameObj && gameObj.horasTotalesJugadas) ? `${gameObj.horasTotalesJugadas}h` : 'N/A',
              review.dificultad || 'N/A'
            ];
          });

          // Safely determine currentY based on lastAutoTable (might not exist in some branches)
          // Use Math.max so we never move yPosition backwards and overlap the decorative line
          const lastTableY = doc.lastAutoTable ? doc.lastAutoTable.finalY : yPosition;
          yPosition = Math.max(lastTableY + 20, yPosition);

          // Calculate available width for the table and assign proportional widths that
          // always sum to the inner page width (avoids overflowing to the right).
          const pageInnerWidth = pageWidth - 40; // left+right margins

          // Define proportional shares for each column (sums to 1.0)
          const shares = {
            juego: 0.18, // small but visible
            rating: 0.10,
            resena: 0.44, // main content column
            horas: 0.14,
            dificultad: 0.14
          };

          // Compute numeric widths (rounded) and ensure they don't exceed the inner width
          const colWidths = {
            0: Math.floor(pageInnerWidth * shares.juego),
            1: Math.floor(pageInnerWidth * shares.rating),
            2: Math.floor(pageInnerWidth * shares.resena),
            3: Math.floor(pageInnerWidth * shares.horas),
            4: Math.floor(pageInnerWidth * shares.dificultad)
          };

          // Adjust last column to absorb rounding drift so total equals pageInnerWidth
          const totalAssigned = Object.values(colWidths).reduce((s, v) => s + v, 0);
          const drift = pageInnerWidth - totalAssigned;
          if (drift !== 0) {
            colWidths[2] += drift; // give the drift to the 'Reseña' column
          }

          autoTable(doc, {
            startY: yPosition,
            head: [['Juego', 'Rating', 'Reseña', 'Horas', 'Dificultad']],
            body: reviewData,
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], textColor: [255,255,255] },
            margin: { left: 20, right: 20 },
            columnStyles: {
              0: { cellWidth: colWidths[0], fontStyle: 'bold' },
              1: { cellWidth: colWidths[1], halign: 'center' },
              2: { cellWidth: colWidths[2] },
              3: { cellWidth: colWidths[3], halign: 'center' },
              4: { cellWidth: colWidths[4], halign: 'center' }
            },
            styles: {
              fontSize: 9,
              cellPadding: 3,
              lineColor: [200, 200, 200],
              lineWidth: 0.1,
              overflow: 'linebreak'
            }
          });
        }
      }

      // === PIE DE PÁGINA PROFESIONAL ===
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Línea superior del pie de página
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(20, doc.internal.pageSize.height - 20, pageWidth - 20, doc.internal.pageSize.height - 20);
        
        // Texto del pie de página
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        
        // Lado izquierdo: GameTrack Revolution
        doc.text('GameTrack Revolution', 20, doc.internal.pageSize.height - 12);
        
        // Centro: Número de página
        doc.text(
          `Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 12,
          { align: 'center' }
        );
        
        // Lado derecho: Fecha
        doc.text(
          new Date().toLocaleDateString('es-ES'),
          pageWidth - 20,
          doc.internal.pageSize.height - 12,
          { align: 'right' }
        );
      }

      // === GUARDAR PDF ===
      const fileName = `GameTrack_Biblioteca_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      success(`PDF exportado correctamente: ${fileName}`);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError('Error al exportar el PDF. Inténtalo de nuevo.');
    }
  };

  return { exportGamesToPDF };
};
"use client";

import React, { useState, useMemo } from 'react';
import { Button, Box, Menu, MenuItem, Snackbar, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { Participant, Issue } from '@/types/room';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportDataProps {
  roomId: string;
  participants: Participant[];
  issues: Issue[]; // Ahora usamos el tipo Issue definido
  estimations: Record<string, Record<string, number | string>>; // issueId -> participantId -> value
}

export default function ExportData({ roomId, participants, issues, estimations }: ExportDataProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Verificar si hay datos disponibles para exportar
  const hasExportableData = useMemo(() => {
    // Verificar si hay issues con promedio establecido
    const issuesWithAverage = issues.filter(issue => issue.average);
    return issuesWithAverage.length > 0;
  }, [issues]);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Preparar los datos para exportación
  const prepareData = () => {
    // Verificar si hay issues con promedio establecido
    const issuesWithAverage = issues.filter(issue => issue.average);
    if (issuesWithAverage.length === 0) {
      return [];
    }

    // Filtrar solo participantes activos que hayan votado en al menos un issue
    const relevantParticipants = participants.filter(p => {
      // Mantener participantes activos
      if (p.active === false) return false;

      // Verificar si el participante ha votado en algún issue
      const hasVoted = issues.some(issue =>
        estimations[String(issue.id)]?.[p.id] !== undefined
      );
      return hasVoted;
    });

    // Crear un array de objetos con los datos de cada issue y sus estimaciones
    return issuesWithAverage.map(issue => {
      // Determinar el estado real del issue
      let actualStatus = issue.status;
      if (issue.average) {
        actualStatus = 'estimated';
      }

      const issueData: Record<string, string | number | boolean | null | undefined> = {
        key: issue.key,
        summary: issue.summary,
        average: issue.average || 'N/A',
        status: actualStatus
      };

      // Añadir las estimaciones de cada participante relevante
      relevantParticipants.forEach(participant => {
        const estimation = estimations[String(issue.id)]?.[participant.id];
        if (estimation !== undefined) {
          issueData[`${participant.name}`] = estimation;
        }
      });

      return issueData;
    });
  };

  // Exportar a CSV
  const exportToCSV = () => {
    try {
      const data = prepareData();
      if (data.length === 0) {
        showNotification('No hay datos para exportar', 'error');
        return;
      }

      // Obtener los encabezados (todas las claves posibles)
      const headers = Array.from(
        new Set(
          data.flatMap(item => Object.keys(item))
        )
      );

      // Crear las filas CSV
      const csvRows = [
        headers.join(','), // Encabezados
        ...data.map(item =>
          headers.map(header =>
            item[header] !== undefined ? `"${String(item[header]).replace(/"/g, '""')}"` : '""'
          ).join(',')
        )
      ];

      // Unir las filas con saltos de línea
      const csvContent = csvRows.join('\n');

      // Crear un blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `poker_planning_${roomId}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification('Datos exportados a CSV correctamente', 'success');
    } catch (error) {
      console.error('Error al exportar a CSV:', error);
      showNotification('Error al exportar a CSV', 'error');
    }
    handleClose();
  };

  // Exportar a JSON
  const exportToJSON = () => {
    try {
      const data = prepareData();
      if (data.length === 0) {
        showNotification('No hay datos para exportar', 'error');
        return;
      }

      const jsonContent = JSON.stringify({
        roomId,
        exportDate: new Date().toISOString(),
        issues: data
      }, null, 2);

      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `poker_planning_${roomId}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showNotification('Datos exportados a JSON correctamente', 'success');
    } catch (error) {
      console.error('Error al exportar a JSON:', error);
      showNotification('Error al exportar a JSON', 'error');
    }
    handleClose();
  };

  // Exportar a PDF
  const exportToPDF = () => {
    try {
      const data = prepareData();
      if (data.length === 0) {
        showNotification('No hay datos para exportar', 'error');
        return;
      }

      // Crear un nuevo documento PDF
      const doc = new jsPDF();

      // Añadir título
      doc.setFontSize(18);
      doc.text(`Planning Poker - Sala ${roomId}`, 14, 22);

      // Añadir fecha
      doc.setFontSize(11);
      doc.text(`Exportado el ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);

      // Obtener los encabezados
      const headers = ['Key', 'Summary', 'Average', 'Status'];


      // Preparar los datos para la tabla
      const tableData = data.map(item => {
        const row = [
          String(item.key),
          String(item.summary),
          String(item.average || 'N/A'),
          String(item.status)
        ];

        return row;
      });

      // Crear la tabla
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: 40,
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 'auto' }, // Key
          1: { cellWidth: 'auto' }, // Summary
          2: { cellWidth: 20 }, // Average
          3: { cellWidth: 30 }, // Status
        },
        didDrawPage: (data) => {
          // Añadir pie de página con número de página
          doc.setFontSize(10);
          doc.text(
            `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        }
      });

      // Guardar el PDF
      doc.save(`poker_planning_${roomId}_${new Date().toISOString().split('T')[0]}.pdf`);

      showNotification('Datos exportados a PDF correctamente', 'success');
    } catch (error) {
      console.error('Error al exportar a PDF:', error);
      showNotification('Error al exportar a PDF', 'error');
    }
    handleClose();
  };

  return (
    <>
      <Box sx={{ mb: 2 }}>
        {hasExportableData ? (
          <>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon fontSize="small" />}
              onClick={handleClick}
              aria-controls="export-menu"
              aria-haspopup="true"
              size="medium"
              sx={{
                textTransform: 'none',
                width: '200px',
                height: '36px',
                justifyContent: 'center',
                fontSize: '0.875rem'
              }}
            >
              Exportar Datos
            </Button>
            <Menu
              id="export-menu"
              anchorEl={anchorEl}
              keepMounted
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={exportToCSV}>Exportar a CSV</MenuItem>
              <MenuItem onClick={exportToJSON}>Exportar a JSON</MenuItem>
              <MenuItem onClick={exportToPDF}>Exportar a PDF</MenuItem>
            </Menu>
          </>
        ) : (
          <Button
            variant="outlined"
            color="primary"
            disabled
            startIcon={<DownloadIcon fontSize="small" />}
            sx={{
              textTransform: 'none',
              cursor: 'not-allowed',
              width: '200px',
              height: '36px',
              justifyContent: 'center',
              fontSize: '0.875rem'
            }}
            title="No hay datos para exportar. Completa la estimación de al menos un issue."
          >
            Exportar Datos
          </Button>
        )}
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </>
  );
}
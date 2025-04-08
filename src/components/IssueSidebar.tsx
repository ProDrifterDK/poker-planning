"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Box,
    Typography,
    Button,
    Divider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl
} from "@mui/material";
import { ref, onValue, push, update } from "firebase/database";
import { realtimeDb } from "@/lib/firebaseConfig";

// Interfaz local para Issue
interface Issue {
    id: string;
    key: string;
    summary: string;
    votes?: number;
    average?: string | null; // Promedio guardado en la DB
}

interface IssueSidebarProps {
    roomId: string | string[] | undefined;
    currentIssueId: string | null;         // Issue actual en discusión
    setCurrentIssueId: (issueId: string | null) => void; // callback
}

export default function IssueSidebar({
    roomId,
    currentIssueId,
    setCurrentIssueId,
}: IssueSidebarProps) {
    const [issues, setIssues] = useState<Issue[]>([]);
    const { t } = useTranslation('room');

    // Para el diálogo de "Agregar Issue"
    const [dialogOpen, setDialogOpen] = useState(false);
    const [issueKey, setIssueKey] = useState("");
    const [issueSummary, setIssueSummary] = useState("");

    useEffect(() => {
        if (!roomId) return;

        const issuesRef = ref(realtimeDb, `rooms/${roomId}/issues`);
        const unsubscribe = onValue(issuesRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) {
                setIssues([]);
                return;
            }
            const arr: Issue[] = Object.entries(data).map(([key, val]) => {
                const obj = val as {
                    key: string;
                    summary: string;
                    votes?: number;
                    average?: string;
                };
                return {
                    id: key,
                    key: obj.key,
                    summary: obj.summary,
                    votes: obj.votes ?? 0,
                    average: obj.average ?? null,
                };
            });
            setIssues(arr);
        });

        return () => unsubscribe();
    }, [roomId]);

    // Cuando el usuario seleccione un "Issue en Discusión"
    const handleSelectIssue = async (issueId: string) => {
        setCurrentIssueId(issueId);
        if (roomId) {
            const roomRef = ref(realtimeDb, `rooms/${roomId}`);
            await update(roomRef, { currentIssueId: issueId });
        }
    };

    // Manejo de diálogo para Agregar Issue
    const handleOpenDialog = () => setDialogOpen(true);
    const handleCloseDialog = () => setDialogOpen(false);

    const handleAddIssue = async () => {
        if (!issueKey.trim() || !issueSummary.trim() || !roomId) return;

        const issuesRef = ref(realtimeDb, `rooms/${roomId}/issues`);
        const newIssueRef = push(issuesRef);
        await update(newIssueRef, {
            key: issueKey,
            summary: issueSummary,
            votes: 0,
            average: null,
        });

        setIssueKey("");
        setIssueSummary("");
        handleCloseDialog();
    };

    return (
        <Box
            sx={{
                width: 300,
                maxHeight: "100vh",
                overflowY: "auto",
                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Encabezado */}
            <Box sx={{ p: 2 }}>
                <Typography variant="h6">{t('issues.title')}</Typography>
            </Box>
            <Divider />

            {/* Selector de Issue en Discusión */}
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                <FormControl size="small" fullWidth>
                    <InputLabel id="issue-select-label">{t('issues.currentIssue')}</InputLabel>
                    <Select
                        labelId="issue-select-label"
                        label={t('issues.currentIssue')}
                        value={currentIssueId || ""}
                        onChange={(e) => handleSelectIssue(e.target.value)}
                    >
                        <MenuItem value="">
                            <em>{t('issues.none')}</em>
                        </MenuItem>
                        {issues.map((issue) => (
                            <MenuItem key={issue.id} value={issue.id}>
                                {issue.key}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>
            <Divider />

            {/* Lista de Issues + botón de agregar */}
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
                {issues.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        {t('issues.noIssues')}
                    </Typography>
                ) : (
                    issues.map((issue) => (
                        <Box
                            key={issue.id}
                            sx={{
                                p: 1,
                                border: (theme) => `1px solid ${theme.palette.divider}`,
                                borderRadius: 1,
                                wordBreak: "break-word",
                                overflowWrap: "break-word",
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight="bold">
                                {issue.key}
                            </Typography>
                            <Typography variant="body2">{issue.summary}</Typography>

                            {/* Mostrar el promedio, si existe */}
                            {issue.average && (
                                <Typography variant="body2" color="text.secondary">
                                    Promedio: {issue.average}
                                </Typography>
                            )}
                        </Box>
                    ))
                )}

                <Divider />

                <Button variant="outlined" onClick={handleOpenDialog} sx={{ textTransform: "none" }}>
                    {t('issues.addIssue')}
                </Button>
            </Box>

            {/* Dialog para agregar un nuevo Issue */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle>{t('issues.addNewIssue')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('issues.enterKeyAndSummary')}
                    </DialogContentText>

                    <TextField
                        margin="dense"
                        label={t('issues.issueKey')}
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={issueKey}
                        onChange={(e) => setIssueKey(e.target.value)}
                        sx={{ mt: 2 }}
                    />

                    <TextField
                        margin="dense"
                        label={t('issues.summary')}
                        type="text"
                        multiline
                        rows={3}
                        fullWidth
                        variant="outlined"
                        value={issueSummary}
                        onChange={(e) => setIssueSummary(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseDialog} sx={{ textTransform: "none" }}>
                        {t('issues.cancel')}
                    </Button>
                    <Button variant="contained" onClick={handleAddIssue} sx={{ textTransform: "none" }}>
                        {t('issues.create')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

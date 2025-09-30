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

import styled from "@emotion/styled";

const SidebarContainer = styled(Box)`
    width: 300px;
    max-height: 100vh;
    overflow-y: auto;
    border-right: 1px solid ${({ theme }) => theme.palette.divider};
    display: flex;
    flex-direction: column;
`;

const HeaderBox = styled(Box)`
    padding: ${({ theme }) => theme.spacing(2)};
`;

const ContentBox = styled(Box)`
    padding: ${({ theme }) => theme.spacing(2)};
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.spacing(2)};
`;

const IssueBox = styled(Box)`
    padding: ${({ theme }) => theme.spacing(1)};
    border: 1px solid ${({ theme }) => theme.palette.divider};
    border-radius: ${({ theme }) => theme.shape.borderRadius}px;
    word-break: break-word;
    overflow-wrap: break-word;
`;

const AddIssueButton = styled(Button)`
    text-transform: none;
`;

const DialogTextField = styled(TextField)`
    margin-top: ${({ theme }) => theme.spacing(2)};
`;

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
        <SidebarContainer>
            {/* Encabezado */}
            <HeaderBox>
                <Typography variant="h6">{t('issues.title')}</Typography>
            </HeaderBox>
            <Divider />

            {/* Selector de Issue en Discusión */}
            <ContentBox>
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
            </ContentBox>
            <Divider />

            {/* Lista de Issues + botón de agregar */}
            <ContentBox>
                {issues.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        {t('issues.noIssues')}
                    </Typography>
                ) : (
                    issues.map((issue) => (
                        <IssueBox key={issue.id}>
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
                        </IssueBox>
                    ))
                )}

                <Divider />

                <AddIssueButton variant="outlined" onClick={handleOpenDialog}>
                    {t('issues.addIssue')}
                </AddIssueButton>
            </ContentBox>

            {/* Dialog para agregar un nuevo Issue */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
                <DialogTitle>{t('issues.addNewIssue')}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t('issues.enterKeyAndSummary')}
                    </DialogContentText>

                    <DialogTextField
                        margin="dense"
                        label={t('issues.issueKey')}
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={issueKey}
                        onChange={(e) => setIssueKey(e.target.value)}
                    />

                    <DialogTextField
                        margin="dense"
                        label={t('issues.summary')}
                        type="text"
                        multiline
                        rows={3}
                        fullWidth
                        variant="outlined"
                        value={issueSummary}
                        onChange={(e) => setIssueSummary(e.target.value)}
                    />
                </DialogContent>

                <DialogActions>
                    <AddIssueButton onClick={handleCloseDialog}>
                        {t('issues.cancel')}
                    </AddIssueButton>
                    <AddIssueButton variant="contained" onClick={handleAddIssue}>
                        {t('issues.create')}
                    </AddIssueButton>
                </DialogActions>
            </Dialog>
        </SidebarContainer>
    );
}

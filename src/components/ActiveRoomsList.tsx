"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Box, 
  Typography, 
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Stack
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/authContext';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { getLocalizedRoute } from '@/utils/routeUtils';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, get, update } from 'firebase/database';
import { firestore, realtimeDb } from '@/lib/firebaseConfig';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface Room {
  id: string;
  title: string;
  seriesKey: string;
  createdAt: number;
  participantsCount: number;
}

interface RoomMetadata {
  creatorId: string;
  title?: string;
  seriesKey?: string;
  createdAt?: number;
  creatorPlan?: string;
  active?: boolean;
}

interface RoomParticipant {
  active?: boolean;
  name?: string;
  joinedAt?: number;
  role?: string;
  participantId?: string;
}

interface RtdbRoomData {
  metadata?: RoomMetadata;
  participants?: Record<string, RoomParticipant>;
}

/**
 * Component to display a list of active rooms for the current user
 * Only shown for Pro and Enterprise users who can have multiple active rooms
 */
export default function ActiveRoomsList() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getCurrentPlan } = useSubscriptionStore();
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation('room');
  
  // Get the current plan
  const currentPlan = getCurrentPlan();
  
  // Fetch active rooms for the current user
  useEffect(() => {
    async function fetchActiveRooms() {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching active rooms for user:', currentUser.uid);
        
        // First try to get rooms from Realtime Database
        const rooms: Room[] = [];
        
        try {
          // Get all rooms from Realtime Database
          const roomsRef = ref(realtimeDb, 'rooms');
          const roomsSnapshot = await get(roomsRef);
          
          if (roomsSnapshot.exists()) {
            const roomsData = roomsSnapshot.val();
            console.log('Found rooms in RTDB:', roomsData);
            
            // Process each room
            for (const [roomId, roomData] of Object.entries(roomsData)) {
              // Type assertion for roomData
              const typedRoomData = roomData as RtdbRoomData;
              
              // Skip if no metadata
              if (!typedRoomData.metadata) {
                console.log(`Room ${roomId} has no metadata, skipping`);
                continue;
              }

              if (typedRoomData.metadata.active === false) {
                continue;
              }
              
              const metadata = typedRoomData.metadata;
              
              // Check if this room was created by the current user
              // Note: Some rooms might have 'anonymous' as creatorId
              console.log(`Room ${roomId} creator:`, metadata.creatorId);
              
              let isUserRoom = false;
              
              // Check if the room was created by the current user
              if (metadata.creatorId === currentUser.uid) {
                console.log(`Room ${roomId} was created by current user (exact match)`);
                isUserRoom = true;
              }
              // For rooms with 'anonymous' creatorId, check if the current user is a moderator participant
              else if (metadata.creatorId === 'anonymous' && typedRoomData.participants) {
                // Get the current user's ID
                const userId = currentUser.uid;
                console.log(`Checking if user ${userId} is a moderator in room ${roomId}`);
                
                // Get the participant IDs for this room from localStorage
                const participantId = localStorage.getItem(`participant_id_${roomId}`);
                console.log(`User's participant ID for this room: ${participantId}`);
                
                if (participantId) {
                  // Check if this participant ID exists in the room and is a moderator
                  const participant = typedRoomData.participants[participantId];
                  
                  if (participant && participant.role === 'moderator' && participant.active !== false) {
                    console.log(`User ${userId} is a moderator in room ${roomId} with participant ID ${participantId}`);
                    isUserRoom = true;
                  } else {
                    console.log(`User ${userId} is NOT a moderator in room ${roomId} or participant not found`);
                  }
                } else {
                  console.log(`No participant ID found for user ${userId} in room ${roomId}`);
                }
              }
              
              if (isUserRoom) {
                console.log(`Adding room ${roomId} to user's active rooms`);
                
                // Get participant count
                let participantsCount = 0;
                if (typedRoomData.participants) {
                  const participantArray = Object.values(typedRoomData.participants);
                  participantsCount = participantArray.filter(p => p.active !== false).length;
                }
                
                rooms.push({
                  id: roomId,
                  title: metadata.title || `${t('activeRooms.roomPrefix')} ${roomId}`,
                  seriesKey: metadata.seriesKey || 'fibonacci',
                  createdAt: metadata.createdAt || Date.now(),
                  participantsCount
                });
              }
            }
          }
        } catch (rtdbError) {
          console.error('Error fetching rooms from RTDB:', rtdbError);
        }
        
        // If no rooms found in RTDB, try Firestore as fallback
        if (rooms.length === 0) {
          console.log('No rooms found in RTDB, trying Firestore');
          
          try {
            // Query Firestore for rooms created by the current user
            const roomsQuery = query(
              collection(firestore, 'rooms'),
              where('createdBy', '==', currentUser.uid)
            );
            
            const querySnapshot = await getDocs(roomsQuery);
            console.log('Firestore query result:', querySnapshot.docs.length, 'rooms found');
            
            // Process each room
            for (const doc of querySnapshot.docs) {
              const roomData = doc.data();
              const roomId = doc.id;
              
              // Skip inactive rooms
              if (roomData.active === false) continue;
              
              console.log(`Processing Firestore room ${roomId}:`, roomData);
              
              // Get participant count from Realtime Database
              let participantsCount = 0;
              try {
                const participantsRef = ref(realtimeDb, `rooms/${roomId}/participants`);
                const participantsSnapshot = await get(participantsRef);
                
                if (participantsSnapshot.exists()) {
                  // Count only active participants
                  const participants = participantsSnapshot.val();
                  const participantArray = Object.values(participants) as Array<{ active?: boolean }>;
                  participantsCount = participantArray.filter(p => p.active !== false).length;
                }
              } catch (err) {
                console.error(`Error fetching participants for room ${roomId}:`, err);
              }
              
              rooms.push({
                id: roomId,
                title: roomData.title || `${t('activeRooms.roomPrefix')} ${roomId}`,
                seriesKey: roomData.seriesKey || 'fibonacci',
                createdAt: roomData.createdAt || Date.now(),
                participantsCount
              });
            }
          } catch (firestoreError) {
            console.error('Error fetching rooms from Firestore:', firestoreError);
          }
        }
        
        console.log(`Found ${rooms.length} active rooms for user ${currentUser.uid}`);
        
        // Sort rooms by creation date (newest first)
        rooms.sort((a, b) => b.createdAt - a.createdAt);
        
        setActiveRooms(rooms);
      } catch (err) {
        console.error('Error fetching active rooms:', err);
        setError('No se pudieron cargar las salas activas. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchActiveRooms();
  }, [currentUser]);
  
  // Format the series key for display
  const formatSeriesKey = (key: string) => {
    switch (key) {
      case 'fibonacci':
        return 'Fibonacci';
      case 'tshirt':
        return 'T-Shirt';
      case 'powers2':
        return 'Powers of 2';
      case 'days':
        return t('activeRooms.days');
      default:
        return key;
    }
  };
  
  // Format the creation date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };
  
  // Join a room
  const handleJoinRoom = (roomId: string) => {
    router.push(getLocalizedRoute(`/room/${roomId}`));
  };

  const handleCloseRoom = async (roomId: string) => {
    const rtdbRoomRef = ref(realtimeDb, `rooms/${roomId}/metadata`);
    const firestoreRoomRef = doc(firestore, 'rooms', roomId);

    try {
      await Promise.all([
        update(rtdbRoomRef, { active: false }),
        updateDoc(firestoreRoomRef, { active: false }),
      ]);

      setActiveRooms((prevRooms) => prevRooms.filter((room) => room.id !== roomId));
    } catch (error) {
      console.error("Error closing room:", error);
      setError(t('activeRooms.closeRoomError'));
    }
  };
  
  // If the user is not on Pro or Enterprise plan, don't show this component
  if (currentPlan !== 'pro' && currentPlan !== 'enterprise') {
    return null;
  }
  
  return (
    <Box sx={{ width: '100%', maxWidth: 500, mb: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
        {t('activeRooms.title')}
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : activeRooms.length === 0 ? (
        <Alert severity="info">{t('activeRooms.noActiveRooms')}</Alert>
      ) : (
        <Grid container spacing={3} justifyContent="center">
          {activeRooms.map((room) => (
            <Grid item xs={12} key={room.id}>
              <Card
                sx={{
                  position: 'relative',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 2,
                  boxShadow: (theme) => theme.shadows[2],
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: (theme) => theme.shadows[6],
                  },
                }}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                    sx={{ mb: 2 }}
                  >
                    <Typography
                      variant="h6"
                      component="h3"
                      sx={{
                        fontWeight: 'bold',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {room.title}
                    </Typography>
                    <Chip label={formatSeriesKey(room.seriesKey)} color="secondary" size="small" sx={{ textTransform: 'capitalize' }} />
                  </Stack>
                  
                  <Stack spacing={1.5} sx={{ color: 'text.secondary' }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AccessTimeIcon fontSize="small" />
                      <Typography variant="body2">
                        {formatDate(room.createdAt)}
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PeopleIcon fontSize="small" />
                      <Typography variant="body2">
                        {room.participantsCount} {t('activeRooms.participants')}
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 1, justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'action.hover' }}>
                  <Button
                    variant="text"
                    color="warning"
                    size="small"
                    onClick={() => handleCloseRoom(room.id)}
                    sx={{ textTransform: 'none', fontWeight: 'bold' }}
                  >
                    {t('activeRooms.dismiss')}
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleJoinRoom(room.id)}
                    endIcon={<ArrowForwardIcon />}
                    sx={{ textTransform: 'none', fontWeight: 'bold' }}
                  >
                    {t('activeRooms.enter')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
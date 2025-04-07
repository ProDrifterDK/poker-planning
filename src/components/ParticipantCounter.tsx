"use client";

import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress, Tooltip, Chip } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import { useRoomStore } from '@/store/roomStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/types/subscription';
import { getPlanLookupKey } from '@/utils/planUtils';
import { doc, getDoc } from 'firebase/firestore';
import { ref, get as firebaseGet } from 'firebase/database';
import { firestore, realtimeDb } from '@/lib/firebaseConfig';

interface ParticipantCounterProps {
  roomCreatorPlan?: SubscriptionPlan;
}

/**
 * Component to display the current participant count and limit
 */
export default function ParticipantCounter({ roomCreatorPlan }: ParticipantCounterProps) {
  const { participants, roomId } = useRoomStore();
  const [creatorPlan, setCreatorPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch the room creator's plan from room metadata
  useEffect(() => {
    async function fetchRoomCreatorPlan() {
      if (!roomId) return;
      
      try {
        setIsLoading(true);
        console.log(`Fetching room data for room: ${roomId}`);
        
        // First, try to get the room data from the Realtime Database
        const rtdbRoomRef = ref(realtimeDb, `rooms/${roomId}/metadata`);
        const rtdbSnapshot = await firebaseGet(rtdbRoomRef);
        
        if (rtdbSnapshot.exists()) {
          const rtdbRoomData = rtdbSnapshot.val();
          console.log('Room data from RTDB:', rtdbRoomData);
          
          if (rtdbRoomData.creatorPlan) {
            console.log(`Found creator plan in RTDB: ${rtdbRoomData.creatorPlan}`);
            setCreatorPlan(rtdbRoomData.creatorPlan);
            return;
          }
        }
        
        // If not found in RTDB, try Firestore
        console.log('Checking Firestore for room data');
        const firestoreRoomRef = doc(firestore, 'rooms', roomId);
        const firestoreRoomDoc = await getDoc(firestoreRoomRef);
        
        if (firestoreRoomDoc.exists()) {
          const firestoreRoomData = firestoreRoomDoc.data();
          console.log('Room data from Firestore:', firestoreRoomData);
          
          // Check if the creator's plan is stored in the room metadata
          if (firestoreRoomData.creatorPlan) {
            console.log(`Found creator plan in Firestore: ${firestoreRoomData.creatorPlan}`);
            setCreatorPlan(firestoreRoomData.creatorPlan);
          } else {
            // If not stored in metadata (for older rooms), try to get it from the creator's user data
            const creatorId = firestoreRoomData.createdBy || firestoreRoomData.creatorId;
            
            if (!creatorId) {
              console.error('Room creator ID not found');
              return;
            }
            
            console.log(`Looking up creator (${creatorId}) subscription`);
            // Get the creator's user data to find their subscription plan
            const userRef = doc(firestore, 'users', creatorId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              console.log('Creator user data:', userData);
              const plan = userData.subscriptionPlan || SubscriptionPlan.FREE;
              console.log(`Setting creator plan from user data: ${plan}`);
              setCreatorPlan(plan);
            } else {
              // Default to FREE if user not found
              console.log('Creator user not found, defaulting to FREE plan');
              setCreatorPlan(SubscriptionPlan.FREE);
            }
          }
        } else {
          console.error(`Room not found in Firestore: ${roomId}`);
        }
      } catch (error) {
        console.error('Error fetching room creator plan:', error);
        // Default to FREE in case of error
        setCreatorPlan(SubscriptionPlan.FREE);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRoomCreatorPlan();
  }, [roomId]);
  
  // Filter active participants
  const activeParticipants = participants.filter(p => p.active !== false);
  const participantCount = activeParticipants.length;
  
  // Use the room creator's plan to determine the maximum participants
  const plan = roomCreatorPlan || creatorPlan;
  
  // Get the maximum participants allowed for this plan
  const planLookupKey = getPlanLookupKey(plan);
  const maxParticipants = SUBSCRIPTION_PLANS[planLookupKey].features.maxParticipants;
  
  // Calculate percentage
  const percentage = Math.min((participantCount / maxParticipants) * 100, 100);
  
  // Determine color based on percentage
  let color = 'success';
  if (percentage > 90) {
    color = 'error';
  } else if (percentage > 70) {
    color = 'warning';
  }
  
  // Show loading state if still fetching the creator's plan
  if (isLoading) {
    return (
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 16,
          px: 1.5,
          py: 0.5,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 10
        }}
      >
        <PeopleIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
        <Typography variant="body2" fontWeight="medium">
          {participantCount}/...
        </Typography>
      </Box>
    );
  }
  
  return (
    <Tooltip
      title={`Esta sala permite hasta ${maxParticipants} participantes (Basado en el plan ${SUBSCRIPTION_PLANS[planLookupKey].name} del creador de la sala)`}
      placement="top"
    >
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          bgcolor: 'background.paper',
          borderRadius: 16,
          px: 1.5,
          py: 0.5,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 10,
          '&:hover': {
            boxShadow: '0 3px 6px rgba(0,0,0,0.15)',
          }
        }}
      >
        <PeopleIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
        <Typography variant="body2" fontWeight="medium" sx={{ mr: 0.5 }}>
          {participantCount}/{maxParticipants}
        </Typography>
        
        {/* Show a small chip if almost at capacity */}
        {percentage > 80 && (
          <Chip 
            label={percentage >= 100 ? "Lleno" : "Casi lleno"} 
            size="small" 
            color={percentage >= 100 ? "error" : "warning"}
            sx={{ 
              height: 20, 
              fontSize: '0.625rem',
              ml: 0.5
            }} 
          />
        )}
      </Box>
    </Tooltip>
  );
}
'use client'; 

import { useEffect, useState } from 'react';
import { notFound, useParams } from 'next/navigation';
import apiClient from '@/utils/apiClient';
import InviteClientComponent from './InviteClientComponent';
import { Box, CircularProgress } from '@mui/material';

interface InviteDetails {
    inviter: string;
    invited: string;
    destination: string;
    from: string;
    to: string;
}

export default function InvitePage() {
    const params = useParams();
    const [inviteInfo, setInviteInfo] = useState<InviteDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchInviteInfo = async () => {
            try {
                const response = await apiClient.get(`/trips/invites/check/${params.token}`);
                setInviteInfo(response.data);
            } catch (err) {
                console.error("Error checking invite:", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchInviteInfo();
    }, [params.token]);

    if (loading) {
        return (
            <Box
                height="100vh"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error || !inviteInfo) {
        return notFound();
    }

    return <InviteClientComponent inviteInfo={inviteInfo} inviteToken={params.token} />;
}
import { notFound } from "next/navigation";
import apiClient from "@/utils/apiClient";
import InviteClientComponent from "./InviteClientComponent";


interface InviteDetails {
    inviter: string;
    invited: string;
    destination: string;
    from: string;
    to: string;
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        const response = await apiClient.get(`/trips/invites/check/${token}`);
        const inviteInfo: InviteDetails = response.data;

        return <InviteClientComponent inviteInfo={inviteInfo} inviteToken={token} />;
    } catch (err) {
        console.error("Error checking invite:", err);
        notFound(); 
    }
}











// "use client";

// import { useEffect, useState } from "react";
// import { useRouter, notFound, useParams } from "next/navigation";
// import { Box } from "@mui/system";
// import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
// import { supabase } from "@/utils/supabase/client";
// import { User } from "@supabase/supabase-js";
// import apiClient from "@/utils/apiClient";

// interface InviteDetails {
//     inviter: string;
//     invited: string;
//     destination: string;
//     from: string;
//     to: string;
//     tripId: number;
// }

// export default function Invite() {
//     const router = useRouter();
//     const params = useParams();
//     const inviteToken = params.token as string;

//     const [user, setUser] = useState<User | null>(null);
//     const [inviteInfo, setInviteInfo] = useState<InviteDetails | null>(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(false);

//     useEffect(() => {
//         async function checkInvite() {
//             try {
//                 const response = await apiClient.get(`/trips/invites/check/${inviteToken}`);
//                 setInviteInfo(response.data);
//             } catch (err) {
//                 console.error("Error checking invite:", err);
//                 setError(true);
//             } finally {
//                 setLoading(false);
//             }
//         }

//         checkInvite();
//     }, [inviteToken]);

//     useEffect(() => {
//         async function checkAuth() {
//             const { data: { user } } = await supabase.auth.getUser();
//             setUser(user);

//             if (user) {
//                 try {
//                     const response = await apiClient.get(`/trips/1/invites/validate/${inviteToken}`);
//                     setInviteInfo(response.data);
//                 } catch (err) {
//                     console.error("Error validating invite:", err);
//                     setError(true);
//                 }
//             }
//         }

//         checkAuth();
//     }, [inviteToken]);

//     if (loading) return <Box height="100vh" paddingTop="100px"><h1>Loading...</h1></Box>;
//     if (error) return notFound(); // Show Next.js 404 page if invite is invalid
//     if (!inviteInfo) return null; // Prevent rendering issues before data is loaded

//     const handleLoginRedirect = () => {
//         sessionStorage.setItem("inviteRedirect", `/trips/invite/${inviteToken}`);
//         router.push("/login");
//     };

//     const handleAcceptInvite = async () => {
//         try {
//             await apiClient.post(`/trips/invites/accept`, { token: inviteToken });
//             router.push(`/trips/${inviteInfo.tripId}`);
//         } catch (err) {
//             console.error("Failed to accept invite:", err);
//         }
//     };

//     const handleRejectInvite = async () => {
//         try {
//             await apiClient.post(`/trips/invites/reject`, { token: inviteToken });
//             router.push("/dashboard");
//         } catch (err) {
//             console.error("Failed to reject invite:", err);
//         }
//     };

//     return (
//         <Box height="100vh" paddingTop="100px">
//             <Dialog open={true}>
//                 <DialogTitle>Trip Invitation</DialogTitle>
//                 <DialogContent>
//                     <p><strong>Invited By:</strong> {inviteInfo.inviter}</p>
//                     <p><strong>Email:</strong> {inviteInfo.invited}</p>
//                     <p><strong>Destination:</strong> {inviteInfo.destination}</p>
//                     <p><strong>Dates:</strong> {new Date(inviteInfo.from).toDateString()} - {new Date(inviteInfo.to).toDateString()}</p>
//                     {!user ? (
//                         <p>You need to log in or sign up to join this trip.</p>
//                     ) : (
//                         <p>Would you like to accept the invitation?</p>
//                     )}
//                 </DialogContent>
//                 <DialogActions>
//                     {!user ? (
//                         <Button onClick={handleLoginRedirect} color="primary">Login / Signup</Button>
//                     ) : (
//                         <>
//                             <Button onClick={() => router.push(`/trips/${inviteInfo.tripId}`)}>View Trip</Button>
//                             <Button onClick={handleAcceptInvite} color="success">Accept</Button>
//                             <Button onClick={handleRejectInvite} color="error">Reject</Button>
//                         </>
//                     )}
//                 </DialogActions>
//             </Dialog>
//         </Box>
//     );
// }

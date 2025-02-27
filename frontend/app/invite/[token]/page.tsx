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

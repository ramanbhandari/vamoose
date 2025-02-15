import { createClient } from "@/utils/supabase/server";
import { Typography, Box } from "@mui/material";

import { getMessages } from "./messages";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // below we added "Guest" since typescript says user can be null,
  // it doesnt know we are handling route protection in global middleware so we can have it like this to resolve that
  return (
    <Box className="min-h-screen flex flex-col items-center justify-center p-4">
      <Typography variant="h4" sx={{ mb: 2 }}>
        {getMessages.welcome} {user ? user.email : "Guest"}!
      </Typography>
    </Box>
  );
}

import { useUser } from "../../slices/userSlice";
import { lichessLogout } from "../../api/lichess";

// The Lichess account a mode acts as, so playing or broadcasting from the wrong one is caught, and a way to switch.
// Logging out shows the page's login prompt again.
const LichessAccount = ({ disabled = false }: { disabled?: boolean }) => {
  const { username, token } = useUser();

  return (
    <div className="flex items-center justify-center gap-1 text-sm text-[#dee2e6]">
      <span className="truncate" title={username}>{username}</span>
      <span aria-hidden="true">·</span>
      <button type="button" className="shrink-0 underline underline-offset-2 hover:text-white disabled:opacity-65"
        onClick={() => { void lichessLogout(token); }} disabled={disabled}>
        Log out
      </button>
    </div>
  );
};

export default LichessAccount;

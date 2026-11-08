import { useTranslation } from "react-i18next";
import { LogIn } from "lucide-react";
import { DropdownItem, DropdownText } from "./dropdown";
import { lichessLogin } from "../../api/lichess";

// Signing in with Lichess, for a menu. Signing in leaves the page, and only the login outlives that, so with a game in
// progress it first says the game will be lost (and can offer to copy it).
const SignInItems = ({ returnTo, gameInProgress, onCopyPgn }: {
  returnTo: string,
  gameInProgress: boolean,
  onCopyPgn?: () => void
}) => {
  const { t } = useTranslation();
  const signIn = () => { void lichessLogin(returnTo); };

  if (!gameInProgress) {
    return <DropdownItem icon={LogIn} onClick={signIn}>{t("common.signInLichess")}</DropdownItem>;
  }
  return (<>
    <DropdownText>
      <span className="block max-w-56 text-sm opacity-75">{t("export.signInWarning")}</span>
    </DropdownText>
    {(onCopyPgn !== undefined) && <DropdownItem onClick={onCopyPgn}>{t("common.copyPgn")}</DropdownItem>}
    <DropdownItem icon={LogIn} onClick={signIn}>{t("export.signInAnyway")}</DropdownItem>
  </>);
};

export default SignInItems;

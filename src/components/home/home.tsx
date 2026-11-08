import { useTranslation } from "react-i18next";
import NavButton from "./navButton";

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col overflow-auto bg-dark text-center text-white">
      {/* my-auto centres the modes */}
      <div className="home-modes mx-auto my-auto grid w-full gap-4 p-4">
        {/* The header shows the name, so this only names the page for screen readers */}
        <h1 className="sr-only">ChessCam</h1>
        <NavButton to="/upload" text={t("home.upload")} description={t("home.uploadDescription")} />
        <NavButton to="/record" text={t("home.record")} description={t("home.recordDescription")} />
        <NavButton to="/play" text={t("home.play")} description={t("home.playDescription")} />
        <NavButton to="/broadcast" text={t("home.broadcast")} description={t("home.broadcastDescription")} />
      </div>
    </div>
  );
};

export default Home;

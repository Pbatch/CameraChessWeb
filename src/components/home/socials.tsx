import { SocialIcon } from 'react-social-icons/component'
import 'react-social-icons/youtube'
import 'react-social-icons/github'
import 'react-social-icons/google_play'

const Socials = () => {
  const socials = [
    {"network": "github", "url": "https://github.com/Pbatch/CameraChessWeb", "bgColor": "#111111"},
    {"network": "youtube", "url": "https://www.youtube.com/channel/UCtgc3RevHj6UHq1D8Ymarmw"},
    {"network": "google_play", "url": "https://play.google.com/store/apps/details?id=com.camerachess.www.twa"}
  ]

  const icons: any[] = [];
  socials.forEach(social => {
    icons.push(
      <div key={social.network} className="col">
        <SocialIcon target="_blank" 
        network={social.network} url={social.url} bgColor={social?.bgColor} />
      </div>
    );
  });
  return icons;
};

export default Socials;
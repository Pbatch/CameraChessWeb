<div align="center">

📌 This app is under active development and may experience minor issues.  
Please report any bugs on Discord, and we will fix them promptly.

<table>
  <tr>
    <td align=center>
      <img src="https://github.com/user-attachments/assets/f7e73c25-36f6-42b7-aae9-e970e7bcebeb" alt="ChessCam" width="512">
    </td>
  </tr>
</table>

[![Discord](https://img.shields.io/badge/Discord-00c8d6?logo=discord&logoColor=white&style=flat)](https://discord.gg/3yQth8YBp8)
[![All Contributors](https://img.shields.io/badge/all_contributors-6-orange.svg?style=flat-square)](#contributors-)

Replace Chess eBoards with your phone camera using ChessCam (https://www.chesscam.net).

Download the free app on [Google Play](https://play.google.com/store/apps/details?id=com.camerachess.www.twa).

Do you have ideas, bugs to report or training footage? Join our [Discord Server](https://discord.gg/3yQth8YBp8).

</div>

## Demo
[<img src="https://raw.githubusercontent.com/wiki/Pbatch/CameraChessWeb/images/thumbnail.png" width="100%">](https://youtu.be/AAs4EX372bc)

## Roadmap

* Raise an alert when an illegal move is played (currently they're just ignored)
* Add sounds for the opponents moves in "/play"
* Add support for variants
* Develop a testing framework for different board + piece sets
* ... Your next big idea?

## Models, Data, Reports and Scripts

Please post in the Issues tab if you need any help with:
* Running inference
* Exporting models to different formats
* Training on data of varying resolutions (I.e. 640x640)
* etc. etc.

### Pieces

| Name | Description | Link |
| :---: | :---: | :---: |
| 480M_leyolo_pieces.onnx | LeYOLO ONNX model| https://drive.google.com/file/d/1-80xp_nly9i6s3o0mF0mU9OZGEzUAlGj/view?usp=sharing |
| 480M_leyolo_pieces.pt | LeYOLO pt model | https://drive.google.com/file/d/1L6PZbSdT-peCmiJGNwmgHJN5MTpfAM-0/view?usp=sharing |
| pieces.tar.gz | Train/test data in YOLOv5 format | https://drive.google.com/file/d/1CrrINu11Wy8Cv1H4Q9DbcGqir3GPPO29/view?usp=sharing |
| Report | Weights & Biases report from the LeYOLO training run | https://api.wandb.ai/links/pbatch/g2rcvycv |

### Xcorners

| Name | Description | Link |
| :---: | :---: | :---: |
| 480L_leyolo_xcorners.onnx | LeYOLO ONNX model | https://drive.google.com/file/d/1-2wodbiXag9UQ44e2AYAmoRN6jVpxy83/view?usp=sharing |
| 480L_leyolo_xcorners.pt | LeYOLO pt model | https://drive.google.com/file/d/173orSe8eaytN8nin_HOvd2sEfP_wtOUW/view?usp=sharing |
| xcorners.tar.gz | Train/test data in YOLOv5 format | https://drive.google.com/file/d/15Liy-vMcujSZak4YRPeC2TpVjIA3AwVM/view?usp=sharing |
| Report | Weights & Biases report from the LeYOLO training run | https://api.wandb.ai/links/pbatch/ziwur3gr |

### Google Colab scripts

* LeYOLO Training + ONNX export - https://gist.github.com/Pbatch/dccc680ac2f852d4f258e4b6f1997a7b
* TFJS export - https://gist.github.com/Pbatch/46d958df7e0363e42561bda50163a57a

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ConorShepherd"><img src="https://avatars.githubusercontent.com/u/75845466?v=4?s=100" width="100px;" alt="Conor Shepherd"/><br /><sub><b>Conor Shepherd</b></sub></a><br /><a href="#research-ConorShepherd" title="Research">🔬</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/tdr24008"><img src="https://avatars.githubusercontent.com/u/109679977?v=4?s=100" width="100px;" alt="tdr24008"/><br /><sub><b>tdr24008</b></sub></a><br /><a href="#research-tdr24008" title="Research">🔬</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/DakshHandeCode"><img src="https://avatars.githubusercontent.com/u/153603746?v=4?s=100" width="100px;" alt="DakshHandeCode"/><br /><sub><b>DakshHandeCode</b></sub></a><br /><a href="#design-DakshHandeCode" title="Design">🎨</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ChessScholar"><img src="https://avatars.githubusercontent.com/u/65353254?v=4?s=100" width="100px;" alt="ChessScholar"/><br /><sub><b>ChessScholar</b></sub></a><br /><a href="https://github.com/Pbatch/CameraChessWeb/issues?q=author%3AChessScholar" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/JohnP-1"><img src="https://avatars.githubusercontent.com/u/55811674?v=4?s=100" width="100px;" alt="JohnP-1"/><br /><sub><b>JohnP-1</b></sub></a><br /><a href="https://github.com/Pbatch/CameraChessWeb/issues?q=author%3AJohnP-1" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/AbdullahKhetran"><img src="https://avatars.githubusercontent.com/u/101284310?v=4?s=100" width="100px;" alt="Abdullah Khetran"/><br /><sub><b>Abdullah Khetran</b></sub></a><br /><a href="#research-AbdullahKhetran" title="Research">🔬</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

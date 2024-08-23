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

## Models 

Here are the models in ONNX format, post in the Issues if you want them in PyTorch format as well.
Once you've downloaded the models, you can view them in Netron (https://netron.app/). 

| Name | Description | Link |
| :---: | :---: | :---: |
| 480L_leyolo_xcorners.onnx | LeYOLO xcorners detector | https://drive.google.com/file/d/1-2wodbiXag9UQ44e2AYAmoRN6jVpxy83/view?usp=sharing |
| 480M_leyolo_pieces.onnx | LeYOLO pieces detector | https://drive.google.com/file/d/1-80xp_nly9i6s3o0mF0mU9OZGEzUAlGj/view?usp=sharing |

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

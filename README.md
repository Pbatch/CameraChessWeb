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

## Model

ChessCam reads the board with [ChessQueries](https://github.com/JSeytre/chessqueries)
([paper](https://arxiv.org/abs/2608.30762)). The model takes the whole camera frame,
or a region drawn around the board, and predicts the piece on each of the 64 squares
directly, so there are no board corners to set.

The app runs [ChessQ ChessCam](https://huggingface.co/PBatch23888/chessq-chesscam):
[ChessQ Lite](https://huggingface.co/joelseytre/chessq-lite) fine-tuned on ChessCam footage
and exported to LiteRT. The model is downloaded from Hugging Face on first use and then cached.
It runs in the browser with [LiteRT.js](https://ai.google.dev/edge/litert/web) on WebGPU,
and falls back to the CPU (WebAssembly) when WebGPU is not available. The CPU is much
slower, and the FPS counter shows "(CPU)" when it is in use.

To re-export the model from a ChessQueries checkpoint, run this from the chessqueries repository,
then upload the file to the Hugging Face repository and update `MODEL_URL` in `src/utils/chessqueries.tsx`:

```bash
uv run --no-project --python 3.12 --with litert-torch==0.9.4 --with timm==1.0.27 \
    --with safetensors python scripts/export_litert.py \
    <checkpoint>.safetensors chessq-chesscam-fp16.tflite
```

The model weights are licensed under
[PolyForm Noncommercial 1.0.0](https://huggingface.co/PBatch23888/chessq-chesscam#license),
not under this repository's license.

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
      <td align="center" valign="top" width="14.28%"><a href="http://tejasraman.me"><img src="https://avatars.githubusercontent.com/u/96961804?v=4?s=100" width="100px;" alt="Tejas Raman"/><br /><sub><b>Tejas Raman</b></sub></a><br /><a href="#security-tejasraman" title="Security">🛡️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/danispringer"><img src="https://avatars.githubusercontent.com/u/19246409?v=4?s=100" width="100px;" alt="Dani Springer Chess Lessons 🇮🇱"/><br /><sub><b>Dani Springer Chess Lessons 🇮🇱</b></sub></a><br /><a href="https://github.com/Pbatch/CameraChessWeb/commits?author=danispringer" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lucastcox"><img src="https://avatars.githubusercontent.com/u/6495989?v=4?s=100" width="100px;" alt="Lucas Cox"/><br /><sub><b>Lucas Cox</b></sub></a><br /><a href="https://github.com/Pbatch/CameraChessWeb/commits?author=lucastcox" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/squidKid-deluxe"><img src="https://avatars.githubusercontent.com/u/63127872?v=4?s=100" width="100px;" alt="squiddible"/><br /><sub><b>squiddible</b></sub></a><br /><a href="https://github.com/Pbatch/CameraChessWeb/issues?q=author%3AsquidKid-deluxe" title="Bug reports">🐛</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

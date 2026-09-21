# Content and asset provenance

This is an independent educational software demonstration. It has no affiliation with the Ayn Rand Institute. Its lessons introduce selected ideas of Frédéric Bastiat and do not equate his work with Objectivism.

| Asset                                        | Origin and treatment                                                                                                                     | License                             |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Lesson scripts and reading guides            | Original editorial text in `content/editorial.json`, developed with Codex assistance. Paraphrase and commentary; no copied translations. | CC BY 4.0                           |
| Window, law, trade, and choice illustrations | Original SVG compositions, generated from the source in `scripts/create-artwork.mjs`.                                                    | CC BY 4.0                           |
| Lesson narration                             | Synthetic narration generated locally with Kokoro, voice `af_heart`. Not Bastiat's voice and not an impersonation of a speaker.          | Original narration asset; CC BY 4.0 |
| Video lesson                                 | Original artwork arranged as an illustrated lesson with the corresponding synthetic narration.                                           | CC BY 4.0                           |
| Lora and DM Sans fonts                       | Distributed by their respective `@expo-google-fonts` packages; retain bundled license notices.                                           | SIL Open Font License               |
| Interface icons                              | Lucide packages.                                                                                                                         | ISC                                 |

## Further reading

- [Online Library of Liberty: Frédéric Bastiat](https://oll.libertyfund.org/people/frederic-bastiat).
- [Econlib: Selected Essays on Political Economy](https://www.econlib.org/library/Bastiat/basEss.html).

Links provide access to source reading. Modern translations and external recordings are not redistributed by this project.

## Speech tooling

- [Kokoro model card and Apache-2.0 model license](https://huggingface.co/hexgrad/Kokoro-82M).
- [ONNX distribution](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX).
- `kokoro-js` is a build-time dependency. Models and intermediate audio stay in the ignored `.local/` directory.
- Narration is identified as synthetic in the lesson interface. The scripts remain available for accessible reading and editorial inspection.

Content license: [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Software licensing is separate. Before publishing revised assets, update their provenance here and regenerate the media checksums.

import type { ReactNode } from "react";
import type { ParseKeys } from "i18next";
import { Trans, useTranslation } from "react-i18next";

type Key = ParseKeys;

const Link = ({ href, children }: { href: string, children?: ReactNode }) =>
  <a target="_blank" href={href} rel="noreferrer">{children}</a>;

// The tags the answers can use, by name, so a translation keeps them wherever its words put them
const COMPONENTS = {
  b: <b />,
  stand: <Link href="https://www.amazon.co.uk/dp/B07NVBXYPJ" />,
  github: <Link href="https://github.com/Pbatch/CameraChessWeb" />,
  record: <Link href="https://www.chesscam.net/record" />,
  upload: <Link href="https://www.chesscam.net/upload" />,
  play: <Link href="https://www.chesscam.net/play" />,
  broadcast: <Link href="https://www.chesscam.net/broadcast" />,
  hf: <Link href="https://huggingface.co/PBatch23888/chessq-chesscam" />,
  polyform: <Link href="https://huggingface.co/PBatch23888/chessq-chesscam/blob/main/LICENSE" />,
  dinov3: <Link href="https://huggingface.co/PBatch23888/chessq-chesscam/blob/main/LICENSE-DINOv3" />,
  notice: <Link href="https://huggingface.co/PBatch23888/chessq-chesscam/blob/main/NOTICE" />,
  lichess: <Link href="https://lichess.org/@/BlindfoldBlunderer" />,
};

const Text = ({ k }: { k: Key }) => <Trans i18nKey={k} components={COMPONENTS} />;

// An answer is paragraphs, numbered steps and bullet points, in order
type Block = { p: Key } | { ol: Key[] } | { ul: Key[] } | { node: ReactNode };

const Figure = ({ src, alt, caption }: { src: string, alt: Key, caption: Key }) => {
  const { t } = useTranslation();
  return (
    <figure className="mb-4 inline-block">
      <img src={src} className="mb-2 h-auto max-w-full rounded-md" alt={t(alt)} />
      <figcaption className="text-sm text-white">{t(caption)}</figcaption>
    </figure>
  );
};

const ITEMS: { question: Key, blocks: Block[] }[] = [
  { question: "faq.stand.question", blocks: [{ p: "faq.stand.answer" }] },
  { question: "faq.videos.question", blocks: [{ p: "faq.videos.answer" }] },
  {
    question: "faq.camera.question",
    blocks: [
      { ul: ["faq.camera.step1", "faq.camera.step2", "faq.camera.step3", "faq.camera.step4", "faq.camera.step5"] },
      {
        node: <>
          <Figure src="halfZoom.webp" alt="faq.camera.halfZoom" caption="faq.camera.halfZoomCaption" />
          <Figure src="fullZoom.webp" alt="faq.camera.fullZoom" caption="faq.camera.fullZoomCaption" />
        </>
      },
    ],
  },
  { question: "faq.moving.question", blocks: [{ p: "faq.moving.answer" }] },
  { question: "faq.power.question", blocks: [{ p: "faq.power.answer" }] },
  {
    question: "faq.record.question",
    blocks: [{ ol: ["faq.record.step1", "faq.record.step2", "faq.record.step3"] }, { p: "faq.record.reset" }],
  },
  {
    question: "faq.upload.question",
    blocks: [
      { ol: ["faq.upload.step1", "faq.upload.step2", "faq.upload.step3", "faq.upload.step4"] },
      { p: "faq.upload.speed" },
      { p: "faq.upload.seek" },
      { p: "faq.upload.eval" },
    ],
  },
  {
    question: "faq.play.question",
    blocks: [
      { ol: ["faq.play.step1", "faq.play.step2", "faq.play.step3", "faq.play.step4", "faq.play.step5"] },
      { p: "faq.play.moves" },
      { p: "faq.play.limits" },
    ],
  },
  {
    question: "faq.broadcast.question",
    blocks: [
      {
        ol: ["faq.broadcast.step1", "faq.broadcast.step2", "faq.broadcast.step3", "faq.broadcast.step4",
          "faq.broadcast.step5", "faq.broadcast.step6"]
      },
      { p: "faq.broadcast.moves" },
    ],
  },
  {
    question: "faq.position.question",
    blocks: [
      { p: "faq.position.intro" },
      { ul: ["faq.position.standard", "faq.position.white", "faq.position.black"] },
      { p: "faq.position.check" },
    ],
  },
  { question: "faq.corners.question", blocks: [{ p: "faq.corners.answer" }] },
  { question: "faq.save.question", blocks: [{ p: "faq.save.answer" }] },
  {
    question: "faq.export.question",
    blocks: [
      { p: "faq.export.intro" },
      { ul: ["faq.export.open", "faq.export.study"] },
      { p: "faq.export.signIn" },
    ],
  },
  { question: "faq.offline.question", blocks: [{ p: "faq.offline.answer" }] },
  { question: "faq.illegal.question", blocks: [{ p: "faq.illegal.answer" }] },
  { question: "faq.variants.question", blocks: [{ p: "faq.variants.answer" }] },
  { question: "faq.privacy.question", blocks: [{ p: "faq.privacy.answer" }] },
  {
    question: "faq.licences.question",
    // The licence's required notice, word for word in every language
    blocks: [{ p: "faq.licences.answer" }, { node: <p>Required Notice: Copyright (c) 2026 Joël Seytre.</p> }],
  },
  { question: "faq.openSource.question", blocks: [{ p: "faq.openSource.answer" }] },
  { question: "faq.contact.question", blocks: [{ p: "faq.contact.answer" }, { p: "faq.contact.happy" }] },
];

// Grouped by topic, as Lichess's FAQ is, in the order someone new would need them
export const SECTIONS: { title: Key, questions: Key[] }[] = [
  {
    title: "faq.sections.gettingStarted",
    questions: ["faq.videos.question", "faq.stand.question", "faq.camera.question", "faq.power.question"],
  },
  {
    title: "faq.sections.modes",
    questions: ["faq.record.question", "faq.upload.question", "faq.play.question", "faq.broadcast.question"],
  },
  {
    title: "faq.sections.detection",
    questions: ["faq.position.question", "faq.corners.question", "faq.moving.question", "faq.illegal.question",
      "faq.variants.question"],
  },
  { title: "faq.sections.saving", questions: ["faq.save.question", "faq.export.question"] },
  {
    title: "faq.sections.about",
    questions: ["faq.offline.question", "faq.privacy.question", "faq.openSource.question", "faq.licences.question",
      "faq.contact.question"],
  },
];

// Every question, by its key, for SECTIONS
export const QUESTIONS: Key[] = ITEMS.map(({ question }) => question);

const renderBlock = (block: Block, index: number) => {
  if ("p" in block) return <p key={index}><Text k={block.p} /></p>;
  if ("ol" in block) return <ol key={index}>{block.ol.map((k) => <li key={k}><Text k={k} /></li>)}</ol>;
  if ("ul" in block) return <ul key={index}>{block.ul.map((k) => <li key={k}><Text k={k} /></li>)}</ul>;
  return <div key={index}>{block.node}</div>;
};

// The questions by section, each opening its answer, for the FAQ panel, whose own title is the level above the
// section headings
export const FaqList = () => {
  const { t } = useTranslation();
  return (<>
    {SECTIONS.map(({ title, questions }) => (
      <section key={title} className="faq-section" aria-labelledby={title}>
        <h3 id={title} className="faq-section__title">{t(title)}</h3>
        <div className="faq-list">
          {questions.map((question) => {
            const blocks = ITEMS.find((item) => item.question === question)?.blocks ?? [];
            return (
              <details className="faq-item" key={question}>
                <summary className="faq-question">{t(question)}</summary>
                <div className="faq-answer">{blocks.map(renderBlock)}</div>
              </details>
            );
          })}
        </div>
      </section>
    ))}
  </>);
};

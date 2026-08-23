export interface DocumentDiffProps {
  filename: string;
  previousMarkdown: string;
  updatedMarkdown: string;
  hideFileHeader?: boolean;
  className?: string;
}

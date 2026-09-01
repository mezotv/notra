export interface AttachmentRow {
  id: string;
  key: string;
  filename: string;
  mediaType: string;
  size: number;
  createdAt: Date;
  url: string;
}

export interface AttachmentCardProps {
  attachment: AttachmentRow;
  selected: boolean;
  pending: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onSelectedChange: (selected: boolean) => void;
}

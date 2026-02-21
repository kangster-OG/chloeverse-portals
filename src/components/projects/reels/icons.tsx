import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function BaseIcon({
  size = 24,
  children,
  className,
  ...props
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function InstagramNavIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3.7" y="3.7" width="16.6" height="16.6" rx="5.3" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.25" cy="6.8" r="1.15" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 10.6L12 4l8 6.6" />
      <path d="M6.4 9.7V20h11.2V9.7" />
    </BaseIcon>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="10.5" cy="10.5" r="5.9" />
      <path d="M15.2 15.2L20 20" />
    </BaseIcon>
  );
}

export function ReelsIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="4.5" width="16" height="15" rx="3.2" />
      <path d="M4 9h16" />
      <path d="M8 4.5l3 4.5" />
      <path d="M13 4.5l3 4.5" />
      <path d="M10 12.2l5.2 3.3L10 18.8z" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function MessagesIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20 7.8c0-2-1.6-3.6-3.6-3.6H7.6C5.6 4.2 4 5.8 4 7.8v6.6C4 16.4 5.6 18 7.6 18H9v2.5L13 18h3.4c2 0 3.6-1.6 3.6-3.6z" />
      <path d="M8.5 10.9h7" />
    </BaseIcon>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 20s-6.9-4.2-8.5-8.1c-1.2-2.8.1-6 3.2-7.1 2.3-.8 4.3.1 5.3 1.8 1-1.7 3-2.6 5.3-1.8 3.1 1.1 4.4 4.3 3.2 7.1C18.9 15.8 12 20 12 20z" />
    </BaseIcon>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4.2" y="4.2" width="15.6" height="15.6" rx="4" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </BaseIcon>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="8.4" r="3.2" />
      <path d="M5.1 19.3c1.7-3.4 4.2-4.9 6.9-4.9s5.2 1.5 6.9 4.9" />
      <circle cx="12" cy="12" r="9.2" strokeWidth={1.2} opacity={0.35} />
    </BaseIcon>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4.2 7.6C4.2 5.6 5.8 4 7.8 4h8.4c2 0 3.6 1.6 3.6 3.6v5.9c0 2-1.6 3.6-3.6 3.6H11l-4.8 3v-3H7.8c-2 0-3.6-1.6-3.6-3.6z" />
    </BaseIcon>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M20 4L10.1 14" />
      <path d="M20 4l-5.4 15.8-4.5-6-6-4.5z" />
    </BaseIcon>
  );
}

export function SaveIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6.1 4.2h11.8v15.6l-5.9-3.8-5.9 3.8z" />
    </BaseIcon>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="6.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </BaseIcon>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 14l6-6 6 6" />
    </BaseIcon>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6 10l6 6 6-6" />
    </BaseIcon>
  );
}

export function VolumeOnIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 14v-4h3.5l4.3-3.5v11l-4.3-3.5z" />
      <path d="M16 9.1c1 .8 1.6 1.8 1.6 2.9 0 1.1-.6 2.1-1.6 2.9" />
      <path d="M18.3 6.7c1.8 1.4 2.9 3.3 2.9 5.3 0 2-1.1 3.9-2.9 5.3" />
    </BaseIcon>
  );
}

export function VolumeOffIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M4 14v-4h3.5l4.3-3.5v11l-4.3-3.5z" />
      <path d="M16.5 9.5l4.5 5" />
      <path d="M21 9.5l-4.5 5" />
    </BaseIcon>
  );
}

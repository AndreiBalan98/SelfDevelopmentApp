/*
 * Icons from Tabler Icons (https://tabler.io/icons), outline set, version 3.19.0.
 * Copied in as SVG rather than installed, so the phone downloads only the icons
 * the app uses. A new icon means copying one more in from the same set.
 *
 * MIT License
 *
 * Copyright (c) 2020-2024 Paweł Kuna
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type { ReactNode } from "react";

// Every Tabler outline icon is drawn on the same 24-unit grid with the same
// 2-unit stroke; only the lines inside differ. It takes its colour from the
// text around it.
function Icon({ size, children }: { size: number; children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function MoonIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
    </Icon>
  );
}

export function SmokingIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M3 13m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" />
      <path d="M8 13l0 4" />
      <path d="M16 5v.5a2 2 0 0 0 2 2a2 2 0 0 1 2 2v.5" />
    </Icon>
  );
}

export function SaladIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4 11h16a1 1 0 0 1 1 1v.5c0 1.5 -2.517 5.573 -4 6.5v1a1 1 0 0 1 -1 1h-8a1 1 0 0 1 -1 -1v-1c-1.687 -1.054 -4 -5 -4 -6.5v-.5a1 1 0 0 1 1 -1z" />
      <path d="M18.5 11c.351 -1.017 .426 -2.236 .5 -3.714v-1.286h-2.256c-2.83 0 -4.616 .804 -5.64 2.076" />
      <path d="M5.255 11.008a12.204 12.204 0 0 1 -.255 -2.008v-1h1.755c.98 0 1.801 .124 2.479 .35" />
      <path d="M8 8l1 -4l4 2.5" />
      <path d="M13 11v-.5a2.5 2.5 0 1 0 -5 0v.5" />
    </Icon>
  );
}

export function BarbellIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M2 12h1" />
      <path d="M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2" />
      <path d="M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1z" />
      <path d="M9 12h6" />
      <path d="M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1z" />
      <path d="M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2" />
      <path d="M22 12h-1" />
    </Icon>
  );
}

export function ChevronLeftIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M15 6l-6 6l6 6" />
    </Icon>
  );
}

export function CalendarIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
      <path d="M16 3v4" />
      <path d="M8 3v4" />
      <path d="M4 11h16" />
      <path d="M11 15h1" />
      <path d="M12 15v3" />
    </Icon>
  );
}

export function PlusIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M12 5l0 14" />
      <path d="M5 12l14 0" />
    </Icon>
  );
}

export function CheckIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M5 12l5 5l10 -10" />
    </Icon>
  );
}

export function ChevronRightIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M9 6l6 6l-6 6" />
    </Icon>
  );
}

export function DownloadIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2" />
      <path d="M7 11l5 5l5 -5" />
      <path d="M12 4l0 12" />
    </Icon>
  );
}

export function SettingsIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" />
      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
    </Icon>
  );
}

export function RotateClockwiseIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M4.05 11a8 8 0 1 1 .5 4m-.5 5v-5h5" />
    </Icon>
  );
}

export function Rotate2Icon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M15 4.55a8 8 0 0 0 -6 14.9m0 -4.45v5h-5" />
      <path d="M18.37 7.16l0 .01" />
      <path d="M13 19.94l0 .01" />
      <path d="M16.84 18.37l0 .01" />
      <path d="M19.37 15.1l0 .01" />
      <path d="M19.94 11l0 .01" />
    </Icon>
  );
}

export function ToggleLeftIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M8 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M2 6m0 6a6 6 0 0 1 6 -6h8a6 6 0 0 1 6 6v0a6 6 0 0 1 -6 6h-8a6 6 0 0 1 -6 -6z" />
    </Icon>
  );
}

export function ToggleRightIcon({ size = 24 }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d="M16 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M2 6m0 6a6 6 0 0 1 6 -6h8a6 6 0 0 1 6 6v0a6 6 0 0 1 -6 6h-8a6 6 0 0 1 -6 -6z" />
    </Icon>
  );
}

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Button as MuiButton } from "@mui/material";
import type { ButtonProps as MuiButtonProps } from "@mui/material";

type AppButtonSize = "small" | "medium" | "large";

export interface ButtonProps
  extends Omit<MuiButtonProps, "size" | "color" | "variant"> {
  active?: boolean;
  selected?: boolean;
  round?: boolean;
  iconOnly?: boolean;
  appSize?: AppButtonSize;
  /**
   * Skips Button's own color/background/shape styling so a custom
   * className (e.g. a translucent pill meant to sit on a colored bar)
   * fully controls appearance instead of fighting it.
   */
  ghost?: boolean;
}

const APP_SIZE_WIDTH: Record<AppButtonSize, string> = {
  large: "75%",
  medium: "50%",
  small: "25%",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { active, selected, round, iconOnly, appSize, ghost, className, sx, ...rest },
    ref,
  ) {
    const classes = [
      "btn",
      active && "btn-active",
      selected && "btn-selected",
      round && "btn-round",
      iconOnly && "btn-icon-only",
      appSize && `btn-${appSize}`,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (ghost) {
      return (
        <button
          ref={ref}
          className={classes}
          {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
        />
      );
    }

    return (
      <MuiButton
        ref={ref}
        variant={iconOnly ? "text" : "contained"}
        disableElevation
        disableRipple
        className={classes}
        sx={[
          {
            borderRadius: round ? "50%" : "20px",
            padding: "0.4em 0.7em",
            fontSize: "1rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            maxWidth: "100%",
            whiteSpace: "normal",
            textTransform: "none",
            backgroundColor: "var(--color-main, #b159cd)",
            color: "var(--color-white, #ffffff)",
            "&:hover": {
              backgroundColor: "var(--color-main, #b159cd)",
              boxShadow: "inset 0 0 100px 100px rgba(255, 255, 255, 0.1)",
            },
            "&:disabled, &.Mui-disabled": {
              opacity: 0.45,
              filter: "grayscale(0.35)",
              backgroundColor: "var(--color-main, #b159cd)",
              color: "var(--color-white, #ffffff)",
            },
          },
          !!selected && {
            boxShadow: "inset 0 0 0 2px rgba(255, 255, 255, 0.6)",
          },
          !!round && {
            width: "40px",
            height: "40px",
            minWidth: "40px",
            padding: "0.5em",
          },
          !!iconOnly && {
            backgroundColor: "transparent",
            color: "var(--color-main, #b159cd)",
            "&:hover": {
              backgroundColor: "var(--color-white, #ffffff)",
              color: "var(--color-main, #b159cd)",
            },
          },
          !!appSize && { width: APP_SIZE_WIDTH[appSize] },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]}
        {...rest}
      />
    );
  },
);

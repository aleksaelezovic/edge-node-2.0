import { useState, cloneElement } from "react";
import { Modal } from "react-native";

import type { PopoverProps } from "./Popover.web";

export default function Popover({ from, children }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {typeof from === "function"
        ? from(isOpen, setIsOpen)
        : cloneElement(from, { onPress: () => setIsOpen(true) })}
      <Modal
        visible={isOpen}
        style={{
          padding: 16,
          backgroundColor: "#0c0c0c80",
        }}
        onRequestClose={() => setIsOpen(false)}
        transparent
      >
        {children}
      </Modal>
    </>
  );
}

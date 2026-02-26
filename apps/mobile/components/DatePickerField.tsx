import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  value: string | null; // YYYY-MM-DD or null
  onChange: (date: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
};

function toDate(s: string | null): Date {
  if (!s) return new Date();
  return new Date(s + "T12:00:00Z");
}

function toYMD(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function DatePickerField({
  value,
  onChange,
  minimumDate,
  maximumDate,
  placeholder = "Select a date",
}: Props) {
  const [show, setShow] = useState(false);

  const displayDate = value
    ? new Date(value + "T12:00:00Z").toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  function handleChange(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") {
      setShow(false);
      if (event.type === "set" && date) {
        onChange(toYMD(date));
      }
    } else if (date) {
      // iOS: update live as the spinner scrolls
      onChange(toYMD(date));
    }
  }

  return (
    <View>
      <Pressable
        style={[styles.trigger, show && styles.triggerOpen]}
        onPress={() => setShow((v) => !v)}
      >
        <Text style={[styles.triggerText, !displayDate && styles.placeholder]}>
          {displayDate ?? placeholder}
        </Text>
        <Text style={styles.icon}>{show ? "▲" : "📅"}</Text>
      </Pressable>

      {show && (
        <View style={styles.pickerWrap}>
          <DateTimePicker
            mode="date"
            value={toDate(value)}
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            themeVariant="dark"
            style={Platform.OS === "ios" ? styles.iosPicker : undefined}
          />
          {Platform.OS === "ios" && (
            <Pressable
              style={styles.doneBtn}
              onPress={() => setShow(false)}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  triggerOpen: {
    borderColor: "#22C55E",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  triggerText: {
    color: "#FFF",
    fontSize: 15,
    flex: 1,
  },
  placeholder: {
    color: "#555",
  },
  icon: {
    fontSize: 13,
    color: "#555",
  },
  pickerWrap: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: "#22C55E",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  iosPicker: {
    height: 180,
  },
  doneBtn: {
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
  },
  doneBtnText: {
    color: "#22C55E",
    fontWeight: "700",
    fontSize: 14,
  },
});

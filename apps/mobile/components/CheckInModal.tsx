import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { trpc } from "@/lib/trpc";

type Rating = "too_easy" | "on_track" | "too_hard";

const RATINGS: { value: Rating; label: string; color: string }[] = [
  { value: "too_hard", label: "😅 Too Hard", color: "#EF4444" },
  { value: "on_track", label: "✅ On Track", color: "#22C55E" },
  { value: "too_easy", label: "💪 Too Easy", color: "#F97316" },
];

export function CheckInModal({
  weekId,
  weekNumber,
  onClose,
}: {
  weekId: string;
  weekNumber: number;
  onClose: () => void;
}) {
  const [rating, setRating] = useState<Rating | null>(null);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<{ adapted: boolean; message: string } | null>(null);

  const utils = trpc.useUtils();

  const submit = trpc.plans.submitCheckIn.useMutation({
    onSuccess: (data) => {
      setResult(data);
      utils.plans.getCurrent.invalidate();
      utils.plans.getCheckIn.invalidate({ weekId });
    },
  });

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={styles.sheet}>
        <Text style={styles.title}>How did Week {weekNumber} feel?</Text>

        {result ? (
          <>
            <Text style={styles.resultText}>{result.message}</Text>
            <Pressable style={styles.submitBtn} onPress={onClose}>
              <Text style={styles.submitBtnText}>Got it</Text>
            </Pressable>
          </>
        ) : (
          <>
            {/* Rating buttons */}
            <View style={styles.ratingRow}>
              {RATINGS.map((r) => (
                <Pressable
                  key={r.value}
                  style={[
                    styles.ratingBtn,
                    rating === r.value && { borderColor: r.color, backgroundColor: r.color + "18" },
                  ]}
                  onPress={() => setRating(r.value)}
                >
                  <Text style={[styles.ratingText, rating === r.value && { color: r.color }]}>
                    {r.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Notes */}
            <TextInput
              style={styles.notesInput}
              placeholder="Any notes? (optional)"
              placeholderTextColor="#555"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            {/* Submit */}
            <Pressable
              style={[styles.submitBtn, !rating && styles.submitBtnDisabled]}
              disabled={!rating || submit.isPending}
              onPress={() => {
                if (!rating) return;
                submit.mutate({ weekId, rating, notes: notes.trim() || undefined });
              }}
            >
              <Text style={styles.submitBtnText}>
                {submit.isPending ? "Saving…" : "Submit"}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: "#111",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  title: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  ratingRow: {
    flexDirection: "row",
    gap: 8,
  },
  ratingBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    backgroundColor: "#1A1A1A",
  },
  ratingText: {
    color: "#AAA",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  notesInput: {
    backgroundColor: "#1A1A1A",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    borderRadius: 12,
    padding: 12,
    color: "#FFF",
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#22C55E",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#1A3A28",
  },
  submitBtnText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 15,
  },
  resultText: {
    color: "#DDD",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
});

import {
  isUuid,
  jsonError,
  jsonOk,
  parseJsonBody,
} from "@/lib/api";
import {
  deleteVerseMark,
  getVerseMarkById,
  updateVerseMark,
} from "@/lib/marks";
import {
  isVerseMarkColor,
  MAX_NOTE_LENGTH,
} from "@/lib/verse-marks";

type MarkPatchBody = {
  noteText?: unknown;
  color?: unknown;
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!isUuid(id)) {
    return jsonError("id must be a valid UUID", 400);
  }

  const existing = await getVerseMarkById(id);
  if (!existing) {
    return jsonError("Mark not found", 404);
  }

  const parsed = await parseJsonBody<MarkPatchBody>(request);
  if ("error" in parsed) {
    return parsed.error;
  }

  const { noteText, color } = parsed.data;

  if (existing.type === "highlight") {
    if (color === undefined) {
      return jsonError("color is required for highlight updates", 400);
    }
    if (!isVerseMarkColor(color)) {
      return jsonError("color must be yellow, green, or blue", 400);
    }

    const updated = await updateVerseMark(id, { color });
    return jsonOk(updated);
  }

  if (noteText === undefined) {
    return jsonError("noteText is required for note updates", 400);
  }
  if (typeof noteText !== "string") {
    return jsonError("noteText must be a string", 400);
  }

  const trimmed = noteText.trim();
  if (trimmed.length === 0) {
    return jsonError("noteText must not be empty", 400);
  }
  if (trimmed.length > MAX_NOTE_LENGTH) {
    return jsonError(`noteText must be at most ${MAX_NOTE_LENGTH} characters`, 400);
  }

  const updated = await updateVerseMark(id, { noteText: trimmed });
  return jsonOk(updated);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!isUuid(id)) {
    return jsonError("id must be a valid UUID", 400);
  }

  const existing = await getVerseMarkById(id);
  if (!existing) {
    return jsonError("Mark not found", 404);
  }

  await deleteVerseMark(id);
  return jsonOk({ deleted: true, id });
}

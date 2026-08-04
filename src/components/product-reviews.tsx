import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BadgeCheck, Star, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  getReviewEligibilityFn,
  listProductReviewsFn,
  submitProductReviewFn,
} from "@/lib/reviews.functions";

const ALLOWED_MEDIA = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm", "video/quicktime"];

const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(?:\?|$)/i.test(url);

function Stars({ rating, size = "h-4 w-4" }: { rating: number; size?: string }) {
  return (
    <span className="inline-flex text-gold" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`${size} ${star <= Math.round(rating) ? "fill-current" : "opacity-30"}`} />
      ))}
    </span>
  );
}

export function ProductReviews({ productId, productName }: { productId: string; productName: string }) {
  const queryClient = useQueryClient();
  const listReviews = useServerFn(listProductReviewsFn);
  const getEligibility = useServerFn(getReviewEligibilityFn);
  const submitReview = useServerFn(submitProductReviewFn);
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user.id ?? null);
      setAuthReady(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      setAuthReady(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const reviewsQuery = useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: () => listReviews({ data: { product_id: productId } }),
  });
  const eligibilityQuery = useQuery({
    queryKey: ["review-eligibility", productId, userId],
    queryFn: () => getEligibility({ data: { product_id: productId } }),
    enabled: !!userId,
  });
  const reviews = reviewsQuery.data ?? [];
  const average = useMemo(
    () => reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
    [reviews],
  );

  const chooseFiles = (selected: FileList | null) => {
    const next = Array.from(selected ?? []);
    if (next.length > 5) return toast.error("Upload up to 5 photos or videos");
    if (next.some((file) => !ALLOWED_MEDIA.includes(file.type))) return toast.error("Use JPG, PNG, WebP, MP4, WebM or MOV files");
    if (next.filter((file) => file.type.startsWith("video/")).length > 1) return toast.error("Upload only one video per review");
    if (next.some((file) => file.type.startsWith("image/") && file.size > 10 * 1024 * 1024)) return toast.error("Each photo must be under 10 MB");
    if (next.some((file) => file.type.startsWith("video/") && file.size > 50 * 1024 * 1024)) return toast.error("The video must be under 50 MB");
    setFiles(next);
  };

  const publish = async () => {
    const eligibility = eligibilityQuery.data;
    if (!userId || !eligibility?.canReview || !eligibility.orderId || submitting) return;
    if (comment.trim().length < 3) return toast.error("Please write a short review");
    setSubmitting(true);
    const uploadedPaths: string[] = [];
    try {
      for (const file of files) {
        const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || (file.type.startsWith("video/") ? "mp4" : "jpg");
        const path = `${userId}/${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage.from("review-media").upload(path, file, {
          contentType: file.type,
          cacheControl: "31536000",
          upsert: false,
        });
        if (error) throw error;
        uploadedPaths.push(path);
      }
      await submitReview({
        data: {
          product_id: productId,
          order_id: eligibility.orderId,
          rating,
          comment,
          media_paths: uploadedPaths,
        },
      });
      setComment("");
      setFiles([]);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] }),
        queryClient.invalidateQueries({ queryKey: ["review-eligibility", productId] }),
        queryClient.invalidateQueries({ queryKey: ["my-reviews"] }),
      ]);
      toast.success("Thank you. Your verified review is live.");
    } catch (error) {
      if (uploadedPaths.length) await supabase.storage.from("review-media").remove(uploadedPaths);
      toast.error(error instanceof Error ? error.message : "Unable to publish review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="text-foreground">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-display text-4xl text-gold">{reviews.length ? average.toFixed(1) : "—"}</span>
            <div><Stars rating={average} /><p className="mt-1 text-xs text-muted-foreground">{reviews.length} verified {reviews.length === 1 ? "review" : "reviews"}</p></div>
          </div>
        </div>
        {!authReady ? <span className="text-xs text-muted-foreground">Checking your account…</span> : !userId ? (
          <Link to="/auth" search={{ redirect: `/products/${productId}#reviews` }} className="border border-gold px-4 py-2.5 text-[10px] font-semibold tracking-[0.18em] text-gold hover:bg-gold hover:text-onyx">SIGN IN TO REVIEW</Link>
        ) : null}
      </div>

      {userId && eligibilityQuery.data?.canReview && (
        <div className="mt-6 border border-gold/50 bg-gold/5 p-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-gold"><BadgeCheck className="h-4 w-4" /> VERIFIED PURCHASE</div>
          <h3 className="mt-2 font-display text-2xl">Review {productName}</h3>
          <div className="mt-4 flex gap-1" aria-label="Choose rating">
            {[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} stars`}><Star className={`h-7 w-7 text-gold ${star <= rating ? "fill-current" : "opacity-30"}`} /></button>)}
          </div>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} rows={4} placeholder="Tell other customers about the design, quality and fit…" className="mt-4 w-full border border-border bg-background p-3 text-sm outline-none focus:border-gold" />
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 border border-dashed border-border px-4 py-4 text-xs text-muted-foreground hover:border-gold hover:text-gold">
            <UploadCloud className="h-5 w-5" /> {files.length ? `${files.length} file${files.length === 1 ? "" : "s"} selected` : "ADD PHOTOS OR ONE VIDEO"}
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(event) => chooseFiles(event.target.files)} />
          </label>
          <p className="mt-2 text-[10px] text-muted-foreground">Up to 5 files. Photos 10 MB each; one video up to 50 MB.</p>
          <button type="button" disabled={submitting} onClick={publish} className="mt-4 bg-gold px-5 py-3 text-[10px] font-semibold tracking-[0.2em] text-onyx disabled:opacity-50">{submitting ? "PUBLISHING…" : "PUBLISH REVIEW"}</button>
        </div>
      )}
      {userId && eligibilityQuery.data && !eligibilityQuery.data.canReview && <p className="mt-5 border border-border p-4 text-xs text-muted-foreground">{eligibilityQuery.data.reason}</p>}

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        {reviews.map((review) => (
          <article key={review.id} className="border border-border bg-background p-5">
            <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-onyx font-display text-gold">{review.customer_name.charAt(0).toUpperCase()}</span><div><p className="font-medium">{review.customer_name}</p>{review.verified_purchase && <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.12em] text-gold"><BadgeCheck className="h-3.5 w-3.5" /> VERIFIED PURCHASE</p>}</div></div><Stars rating={review.rating} size="h-3.5 w-3.5" /></div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
            {review.media_urls.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2">{review.media_urls.map((url) => isVideoUrl(url) ? <video key={url} src={url} controls preload="metadata" className="aspect-square w-full bg-onyx object-cover" /> : <a key={url} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`Customer review of ${productName}`} loading="lazy" className="aspect-square w-full object-cover" /></a>)}</div>}
            <time className="mt-4 block text-[10px] tracking-[0.14em] text-muted-foreground">{new Date(review.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</time>
          </article>
        ))}
        {!reviewsQuery.isLoading && reviews.length === 0 && <p className="sm:col-span-2 border border-border p-6 text-sm text-muted-foreground">No reviews yet. Delivered customers can be the first to review this piece.</p>}
      </div>
    </div>
  );
}

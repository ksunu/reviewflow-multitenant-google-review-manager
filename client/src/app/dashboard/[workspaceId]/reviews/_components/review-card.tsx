import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
import { Star, Sparkles, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AIReplyDialog } from '@/components/ai/ai-reply-dialog'

export default function ReviewCard({ review, workspaceId }: any) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'replied':
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-600 border-green-200 flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" /> Replied
          </Badge>
        )
      case 'flagged':
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-600 border-red-200 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" /> Flagged
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-600 border-yellow-200 flex items-center gap-1"
          >
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        )
    }
  }

  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">
                {review.author_name}
              </span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {review.locations?.name || 'Store Location'}
              </span>
            </div>
            <div className="flex items-center text-amber-500 gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-muted stroke-current'}`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div>{getStatusBadge(review.status)}</div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        <p className="text-sm text-foreground/90 bg-muted/30 p-3 rounded-lg border">
          &ldquo;{review.review_text || 'No review text provided.'}
          &rdquo;
        </p>

        {review.ai_reply_draft && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" /> AI Drafted Response
            </div>
            <p className="text-sm text-foreground">{review.ai_reply_draft}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2 border-t bg-muted/10 flex justify-between items-center text-xs">
        <span className="text-muted-foreground font-mono">
          Source: Google Maps
        </span>

        <AIReplyDialog
          workspaceId={workspaceId}
          review={{
            id: review.id,
            rating: review.rating,
            review_text: review.review_text,
            author_name: review.author_name,
          }}
        />
      </CardFooter>
    </Card>
  )
}

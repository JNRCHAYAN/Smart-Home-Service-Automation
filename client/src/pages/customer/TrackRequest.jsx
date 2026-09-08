import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { requestApi, apiError } from '../../api/index.js';
import StatusStepper from '../../components/common/StatusStepper.jsx';
import Badge from '../../components/common/Badge.jsx';
import Icon from '../../components/common/Icon.jsx';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { toast } from '../../store/toastStore.js';
import { statusClass, bdt, formatDate, timeAgo } from '../../utils/format.js';
import { STATUS } from '../../constants/index.js';
import { cn } from '../../utils/cn.js';

export default function TrackRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [invoice, setInvoice] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = async (silent) => {
    try {
      const res = await requestApi.get(id);
      setRequest(res);
      if (res.feedback?.rating) setRating(res.feedback.rating);
    } catch (err) {
      if (!silent) toast.error(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 4000);
    return () => clearInterval(t);
  }, [id]);

  const openInvoice = async () => {
    try {
      const inv = await requestApi.invoice(id);
      setInvoice(inv);
      setInvoiceOpen(true);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const cancel = async () => {
    setCancelOpen(false);
    try {
      await requestApi.cancel(id);
      toast.info('Request cancelled');
      load(true);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const reschedule = async () => {
    try {
      await requestApi.reschedule(id);
      toast.info('Finding a new provider');
      navigate(`/request/${id}/matches`);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const feedback = async () => {
    if (!rating) return;
    try {
      await requestApi.feedback(id, rating, '');
      toast.success('Thanks for your feedback!');
      load(true);
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  if (loading)
    return (
      <div className="container-page page-shell max-w-3xl space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-28" />
        <Skeleton className="h-40" />
      </div>
    );

  if (!request)
    return (
      <div className="container-page page-shell text-center text-muted">Request not found.</div>
    );

  const providerName = request.candidateMatches?.find(
    (m) => m.providerId === request.matchedProviderId
  )?.businessName;
  const rejected = request.status === STATUS.REJECTED || request.status === STATUS.CANCELLED;

  return (
    <div className="container-page page-shell max-w-3xl">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-text">Live tracking</p>
          <h1 className="mt-1 font-heading text-2xl font-extrabold tracking-tight text-fg">
            {request.serviceType}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {formatDate(request.preferredDate)} · {request.preferredTimeWindow.start}–
            {request.preferredTimeWindow.end} · {request.location?.address}
          </p>
        </div>
        <Badge variant={statusClass(request.status)}>{request.status}</Badge>
      </header>

      {request.imageUrl && (
        <div className="mb-4 overflow-hidden rounded-xl border border-line">
          <img
            src={request.imageUrl}
            alt={`Photo of the ${request.serviceType} issue`}
            className="max-h-64 w-full bg-inset object-contain"
          />
        </div>
      )}

      <div className="card-surface p-5">
        <StatusStepper status={request.status} timeline={request.timeline || []} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {providerName && (
          <section className="card-surface p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-fg">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
                <Icon name="user" size={15} aria-hidden="true" />
              </span>
              Assigned provider
            </h2>
            <p className="text-sm font-medium text-fg">{providerName}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
              <Icon name="phone" size={13} aria-hidden="true" />
              {request.contact?.phone}
            </p>
          </section>
        )}

        <section className="card-surface p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-fg">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-soft text-brand-text">
              <Icon name="inbox" size={15} aria-hidden="true" />
            </span>
            Summary
          </h2>
          <div className="space-y-1.5 text-sm">
            <Row k="Requested" v={timeAgo(request.createdAt)} />
            <Row k="Problem" v={request.problemDetails || '—'} />
            {request.feedback?.rating && <Row k="Your rating" v={`${request.feedback.rating} / 5`} />}
          </div>
        </section>
      </div>

      <section className="card-surface mt-4 p-5">
        <h2 className="mb-4 text-sm font-bold text-fg">Activity timeline</h2>
        {(request.timeline || []).length === 0 ? (
          <p className="text-sm text-muted">No activity recorded yet.</p>
        ) : (
          <ol className="space-y-3">
            {request.timeline.map((t, i) => {
              const last = i === request.timeline.length - 1;
              return (
                <li key={i} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      last ? 'bg-brand shadow-glow' : 'bg-line2'
                    )}
                  />
                  <div>
                    <p className="text-sm font-semibold text-fg">{t.status}</p>
                    <p className="text-xs text-muted">
                      {formatDate(t.timestamp)} · {timeAgo(t.timestamp)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {request.status === STATUS.COMPLETED && (
        <section className="card-surface mt-4 p-5">
          <h2 className="mb-3 text-sm font-bold text-fg">Rate this service</h2>
          <div className="flex flex-wrap items-center gap-3">
            <div
              role="group"
              aria-label="Rating"
              className="flex items-center gap-1"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
                  aria-pressed={rating >= n}
                  onClick={() => setRating(n)}
                  className="rounded-md p-0.5 transition-transform hover:scale-110"
                >
                  <Icon
                    name="star"
                    size={24}
                    className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-line2'}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </div>
            <Button size="sm" onClick={feedback} disabled={!rating}>
              Submit rating
            </Button>
            <Button size="sm" variant="secondary" onClick={openInvoice} icon="receipt">
              View invoice
            </Button>
          </div>
        </section>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {request.status === STATUS.REQUESTED && (
          <Button variant="danger" icon="ban" onClick={() => setCancelOpen(true)}>
            Cancel request
          </Button>
        )}
        {rejected && (
          <Button icon="refresh" onClick={reschedule}>
            Find a new provider
          </Button>
        )}
      </div>

      <div className="mt-6 flex justify-center">
        <Link
          to="/my-requests"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-fg"
        >
          <Icon name="chevronleft" size={16} aria-hidden="true" />
          Back to my requests
        </Link>
      </div>

      {/* Cancel confirmation */}
      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this request?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Keep request
            </Button>
            <Button variant="danger" icon="ban" onClick={cancel}>
              Cancel request
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-danger-soft text-danger-text">
            <Icon name="alert" size={20} aria-hidden="true" />
          </span>
          <p className="text-sm leading-relaxed text-muted">
            Cancelling <strong className="text-fg">{request.serviceType}</strong> will release your
            booked provider. You can create a new request any time.
          </p>
        </div>
      </Modal>

      {/* Invoice */}
      <Modal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        title="Invoice"
        footer={
          <Button variant="secondary" onClick={() => setInvoiceOpen(false)}>
            Close
          </Button>
        }
      >
        {invoice && (
          <div>
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <div className="font-heading text-lg font-extrabold text-fg">{invoice.invoiceNo}</div>
                <div className="text-sm text-muted">{invoice.date ? formatDate(invoice.date) : ''}</div>
              </div>
              <span className="rounded-lg bg-brand-soft px-2.5 py-1 text-xs font-bold text-brand-text">
                {invoice.currency}
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 py-4 text-sm">
              <dt className="text-muted">Provider</dt>
              <dd className="text-right font-semibold text-fg">{invoice.providerName}</dd>
              <dt className="text-muted">Service</dt>
              <dd className="text-right font-semibold text-fg">{invoice.serviceType}</dd>
              <dt className="text-muted">Customer</dt>
              <dd className="text-right font-semibold text-fg">{invoice.customerName}</dd>
            </dl>
            <div className="space-y-2 border-t border-line pt-4 text-sm">
              <Row k="Base charge" v={bdt(invoice.basePrice)} strong />
              <Row k="Service fee (6%)" v={bdt(invoice.serviceCharge)} strong />
              <Row k="VAT (5%)" v={bdt(invoice.tax)} strong />
              <div className="flex justify-between border-t border-line pt-2.5 text-base font-extrabold text-fg">
                <span>Total</span>
                <span className="text-brand-text">{bdt(invoice.total)}</span>
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-inset px-3 py-2 text-xs text-muted">
              Computed summary for this demo build — not a real payment.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({ k, v, strong }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className={strong ? 'font-semibold text-fg' : 'font-medium text-fg'}>{v}</span>
    </div>
  );
}

import { Exhibition } from '@/types';
import { Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface ExhibitionHeaderProps {
  exhibition: Exhibition;
}

export function ExhibitionHeader({ exhibition }: ExhibitionHeaderProps) {
  const isRegistrationOpen =
    exhibition.status === 'active' || exhibition.status === 'registration_open';

  return (
    <div className="relative w-full">
      {/* Banner Image */}
      {exhibition.bannerImageUrl && (
        <div className="relative h-64 w-full overflow-hidden rounded-lg md:h-96">
          <Image
            src={exhibition.bannerImageUrl}
            alt={exhibition.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}

      {/* Exhibition Info Overlay */}
      <div className={`${exhibition.bannerImageUrl ? 'absolute bottom-0 left-0 right-0' : ''} p-6 ${exhibition.bannerImageUrl ? 'text-white' : ''}`}>
        <div className="container mx-auto max-w-6xl">
          {/* Logo and Title */}
          <div className="flex items-start gap-6">
            {exhibition.logoUrl && (
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-white p-2 shadow-lg">
                <Image
                  src={exhibition.logoUrl}
                  alt={`${exhibition.name} logo`}
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold md:text-4xl">{exhibition.name}</h1>
              {exhibition.tagline && (
                <p className="mt-2 text-lg opacity-90">{exhibition.tagline}</p>
              )}
            </div>
          </div>

          {/* Quick Info */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            {/* Venue */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{exhibition.venue}</span>
            </div>

            {/* Event Dates */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(exhibition.onsiteStartDate), 'MMM dd')} -{' '}
                {format(new Date(exhibition.onsiteEndDate), 'MMM dd, yyyy')}
              </span>
            </div>

            {/* Registration Status */}
            {isRegistrationOpen && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Registration Open</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Non-overlay version if no banner */}
      {!exhibition.bannerImageUrl && (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8 rounded-lg">
          <div className="container mx-auto max-w-6xl">
            <div className="flex items-start gap-6">
              {exhibition.logoUrl && (
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-white p-2 shadow-md">
                  <Image
                    src={exhibition.logoUrl}
                    alt={`${exhibition.name} logo`}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground md:text-4xl">
                  {exhibition.name}
                </h1>
                {exhibition.tagline && (
                  <p className="mt-2 text-lg text-muted-foreground">{exhibition.tagline}</p>
                )}

                {/* Quick Info */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{exhibition.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(exhibition.onsiteStartDate), 'MMM dd')} -{' '}
                      {format(new Date(exhibition.onsiteEndDate), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  {isRegistrationOpen && (
                    <div className="flex items-center gap-2 text-primary">
                      <Clock className="h-4 w-4" />
                      <span className="font-semibold">Registration Open</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import { Exhibition } from '@/types';
import { Card } from '@/components/ui/card';
import { badgeVariants } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, Users, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

interface ExhibitionInfoProps {
  exhibition: Exhibition;
}

export function ExhibitionInfo({ exhibition }: ExhibitionInfoProps) {
  return (
    <Card className="p-6">
      <h2 className="text-2xl font-semibold mb-4">About This Exhibition</h2>

      {/* Description */}
      {exhibition.description && (
        <div className="mb-6">
          <p className="text-muted-foreground leading-relaxed">
            {exhibition.description}
          </p>
        </div>
      )}

      <Separator className="my-6" />

      {/* Event Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Event Details</h3>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Venue */}
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Venue</p>
              <p className="text-sm text-muted-foreground">{exhibition.venue}</p>
            </div>
          </div>

          {/* Event Dates */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Event Dates</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(exhibition.onsiteStartDate), 'MMM dd')} -{' '}
                {format(new Date(exhibition.onsiteEndDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Registration Period */}
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Registration Period</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(exhibition.registrationStartDate), 'MMM dd')} -{' '}
                {format(new Date(exhibition.registrationEndDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {/* Entry Type */}
          <div className="flex items-start gap-3">
            <IndianRupee className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <p className="font-medium">Entry Type</p>
              <p className="text-sm text-muted-foreground">
                {exhibition.isPaid ? 'Paid Entry' : 'Free Entry'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      {exhibition.allowedCategories && exhibition.allowedCategories.length > 0 && (
        <>
          <Separator className="my-6" />
          <div>
            <h3 className="text-lg font-semibold mb-3">Registration Categories</h3>
            <div className="flex flex-wrap gap-2">
              {exhibition.allowedCategories.map((category) => (
                <div key={category} className={badgeVariants({ variant: "secondary" })}>
                  {category.replace('_', ' ').toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Features/Highlights */}
      {exhibition.features && exhibition.features.length > 0 && (
        <>
          <Separator className="my-6" />
          <div>
            <h3 className="text-lg font-semibold mb-3">Event Highlights</h3>
            <ul className="space-y-2 list-disc list-inside">
              {exhibition.features.map((feature, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Card>
  );
}


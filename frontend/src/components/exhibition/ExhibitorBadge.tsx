import { Exhibitor } from '@/types';
import { Card } from '@/components/ui/card';
import { badgeVariants } from '@/components/ui/badge';
import { Building2, Mail, Phone, Globe, MapPin } from 'lucide-react';
import Image from 'next/image';

interface ExhibitorBadgeProps {
  exhibitor: Exhibitor;
}

export function ExhibitorBadge({ exhibitor }: ExhibitorBadgeProps) {
  return (
    <Card className="border-primary bg-gradient-to-r from-primary/5 to-primary/10 p-6">
      <div className="flex items-start gap-4">
        {/* Exhibitor Logo */}
        {exhibitor.logoUrl && (
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white p-2 shadow-md">
            <Image
              src={exhibitor.logoUrl}
              alt={`${exhibitor.name} logo`}
              fill
              className="object-contain"
            />
          </div>
        )}

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className={badgeVariants({ className: "mb-2" })}>
                Referred by Exhibitor
              </div>
              <h3 className="text-xl font-bold">{exhibitor.name}</h3>
              {exhibitor.companyName && exhibitor.companyName !== exhibitor.name && (
                <p className="text-sm text-muted-foreground">{exhibitor.companyName}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {exhibitor.description && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {exhibitor.description}
            </p>
          )}

          {/* Contact Info */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {exhibitor.contactEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{exhibitor.contactEmail}</span>
              </div>
            )}
            {exhibitor.contactPhone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">{exhibitor.contactPhone}</span>
              </div>
            )}
            {exhibitor.website && (
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <a
                  href={exhibitor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Visit Website
                </a>
              </div>
            )}
          </div>

          {/* Stall Info */}
          {exhibitor.stallNumber && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                Stall: <span className="font-semibold">{exhibitor.stallNumber}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}


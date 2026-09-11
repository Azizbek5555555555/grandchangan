"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";
import { t, formatMoney } from "@/lib/utils";

type Item = { id: string; name: unknown; price: number; imageUrl?: string | null };

export default function FeaturedSlider({ items, locale }: { items: Item[]; locale: string }) {
  if (!items.length) return null;
  return (
    <Swiper
      modules={[Autoplay, Pagination, EffectCoverflow]}
      effect="coverflow"
      grabCursor
      centeredSlides
      slidesPerView={1.15}
      loop={items.length > 3}
      autoplay={{ delay: 3200, disableOnInteraction: false }}
      pagination={{ clickable: true }}
      coverflowEffect={{ rotate: 0, stretch: 0, depth: 120, modifier: 2, slideShadows: false }}
      breakpoints={{ 640: { slidesPerView: 2.1 }, 1024: { slidesPerView: 3.1 } }}
      className="!pb-14"
    >
      {items.map((it) => (
        <SwiperSlide key={it.id}>
          <div className="group overflow-hidden rounded-3xl border border-brand-gold/20 bg-brand-ink-soft">
            <div className="relative h-72 overflow-hidden">
              {it.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageUrl} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center bg-brand-ink text-brand-gold/30 font-display text-2xl">GrandChangan</div>
              )}
              <div className="absolute inset-0 hero-scrim" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="font-display text-xl text-brand-cream">{t(it.name, locale)}</h3>
                <p className="mt-1 text-brand-gold-light">{formatMoney(it.price)}</p>
              </div>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

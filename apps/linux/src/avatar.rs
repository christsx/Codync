//! Grok-Bot-style characters (same silhouettes and palette as the Apple apps), drawn with cairo.
//! Mirrors CodyncKit/Design/CharacterAvatar.swift: `CharacterAvatar`, `GroupAvatar`, `AvatarWithStatus`.

use gtk::cairo::Context;
use gtk::prelude::*;
use serde_json::Value;
use std::collections::HashMap;
use std::f64::consts::PI;

pub const SHAPES: &[&str] = &[
    "clover", "flower", "triangle", "square", "blob", "ghost", "circle", "drop", "star", "droid",
    "mech", "alien", "hexagon", "cat", "cloud", "pill", "pebble", "puddle",
];
pub const COLORS: &[(&str, u32)] = &[
    ("black", 0x2B2B2B),
    ("brown", 0x936439),
    ("red", 0xFF263C),
    ("orange", 0xFF6700),
    ("yellow", 0xFF9800),
    ("green", 0x00C972),
    ("cyan", 0x00BCA6),
    ("blue", 0x1084FE),
    ("violet", 0x9159FE),
    ("magenta", 0xFF309B),
    ("gray", 0x777777),
];

pub fn rgb(hex: u32) -> (f64, f64, f64) {
    (
        f64::from((hex >> 16) & 0xFF) / 255.0,
        f64::from((hex >> 8) & 0xFF) / 255.0,
        f64::from(hex & 0xFF) / 255.0,
    )
}

pub fn color_of(name: &str) -> u32 {
    COLORS
        .iter()
        .find(|(n, _)| *n == name)
        .map_or(0x1084FE, |c| c.1)
}

fn rounded_rect(cr: &Context, x: f64, y: f64, w: f64, h: f64, r: f64) {
    cr.new_sub_path();
    cr.arc(x + w - r, y + r, r, -PI / 2.0, 0.0);
    cr.arc(x + w - r, y + h - r, r, 0.0, PI / 2.0);
    cr.arc(x + r, y + h - r, r, PI / 2.0, PI);
    cr.arc(x + r, y + r, r, PI, 1.5 * PI);
    cr.close_path();
}

fn ellipse(cr: &Context, x: f64, y: f64, w: f64, h: f64) {
    cr.save().ok();
    cr.translate(x + w / 2.0, y + h / 2.0);
    cr.scale(w / 2.0, h / 2.0);
    cr.new_sub_path();
    cr.arc(0.0, 0.0, 1.0, 0.0, 2.0 * PI);
    cr.restore().ok();
}

/// A quadratic curve as the cubic cairo draws.
fn quad_to(cr: &Context, (cx, cy): (f64, f64), (x, y): (f64, f64)) {
    let (x0, y0) = cr.current_point().unwrap_or((x, y));
    cr.curve_to(
        x0 + 2.0 / 3.0 * (cx - x0),
        y0 + 2.0 / 3.0 * (cy - y0),
        x + 2.0 / 3.0 * (cx - x),
        y + 2.0 / 3.0 * (cy - y),
        x,
        y,
    );
}

/// Draws the silhouette into a 100×100 unit box (`CharacterShape`).
fn silhouette(cr: &Context, shape: &str) {
    if library_shape(cr, shape) {
        return;
    }
    match shape {
        "pebble" => ellipse(cr, 0.0, 10.0, 100.0, 80.0),
        "squircle" => rounded_rect(cr, 4.0, 4.0, 92.0, 92.0, 30.0),
        "tablet" => rounded_rect(cr, 14.0, 0.0, 72.0, 100.0, 22.0),
        "wedge" => {
            cr.move_to(50.0, 4.0);
            quad_to(cr, (90.0, 40.0), (98.0, 86.0));
            quad_to(cr, (50.0, 104.0), (2.0, 86.0));
            quad_to(cr, (10.0, 40.0), (50.0, 4.0));
            cr.close_path();
        }
        "hex" => {
            for i in 0..6 {
                let a = f64::from(i) * PI / 3.0 - PI / 2.0;
                let (x, y) = (50.0 + a.cos() * 49.0, 50.0 + a.sin() * 49.0);
                if i == 0 {
                    cr.move_to(x, y);
                } else {
                    cr.line_to(x, y);
                }
            }
            cr.close_path();
        }
        "cloud" => {
            ellipse(cr, 0.0, 30.0, 55.0, 55.0);
            ellipse(cr, 45.0, 30.0, 55.0, 55.0);
            ellipse(cr, 18.0, 8.0, 64.0, 64.0);
            rounded_rect(cr, 10.0, 50.0, 80.0, 35.0, 15.0);
        }
        "teardrop" => {
            cr.move_to(50.0, 0.0);
            cr.curve_to(62.0, 20.0, 94.0, 38.0, 94.0, 62.0);
            cr.arc(50.0, 62.0, 44.0, 0.0, PI);
            cr.curve_to(6.0, 38.0, 38.0, 20.0, 50.0, 0.0);
            cr.close_path();
        }
        _ => {
            for i in 0..=64 {
                let a = f64::from(i) / 64.0 * 2.0 * PI;
                let r = 46.0 + 3.5 * (a * 3.0 + 0.6).sin();
                let (x, y) = (50.0 + a.cos() * r, 50.0 + a.sin() * r);
                if i == 0 {
                    cr.move_to(x, y);
                } else {
                    cr.line_to(x, y);
                }
            }
            cr.close_path();
        }
    }
}

#[derive(Clone, Copy, PartialEq)]
pub enum Mood {
    Idle,
    Working,
    Needs,
}

pub fn mood(b: &Value) -> Mood {
    match b["status"].as_str() {
        Some("needsInput") => Mood::Needs,
        Some("working") => Mood::Working,
        _ => Mood::Idle,
    }
}

/// Small icons use fewer, larger dots so the gaps and hollow eyes survive.
fn grid(size: f64) -> (i32, &'static [i32], &'static [i32]) {
    if size < 18.0 {
        (7, &[2, 4], &[2, 3])
    } else if size < 28.0 {
        (9, &[3, 6], &[3, 4])
    } else {
        (13, &[4, 8], &[4, 5, 6])
    }
}

/// A halftone of dots shaded as if the silhouette were a ball (grey ink, the bot's color
/// only on the brightest dots), eyes left hollow. Working swings the light and glances;
/// needing you sends a ripple out from the center.
pub fn draw(
    cr: &Context,
    size: f64,
    shape: &str,
    color: &str,
    ink: (f64, f64, f64),
    mood: Mood,
    t: f64,
) {
    cr.save().ok();
    cr.scale(size / 100.0, size / 100.0);
    let (r, g, b) = rgb(color_of(color));
    let (cells, eye_cols, all_eye_rows) = grid(size);
    let step = 100.0 / f64::from(cells);
    let animated = mood != Mood::Idle;
    let glance = if mood == Mood::Working {
        ((t * 2.0 * PI / 3.2).sin() * 1.4).round() as i32
    } else {
        0
    };
    let blinking = animated && (t / 4.7).fract() < 0.035;
    let eye_rows = if blinking {
        &all_eye_rows[all_eye_rows.len() - 1..]
    } else {
        all_eye_rows
    };
    silhouette(cr, shape);
    let hex = shape == "hex";
    if hex {
        cr.set_line_width(8.0);
        cr.set_line_join(gtk::cairo::LineJoin::Round);
    }
    let mut dots = Vec::new();
    for row in 0..cells {
        for col in 0..cells {
            let (x, y) = ((f64::from(col) + 0.5) * step, (f64::from(row) + 0.5) * step);
            let inside =
                cr.in_fill(x, y).unwrap_or(false) || (hex && cr.in_stroke(x, y).unwrap_or(false));
            let eye = eye_cols.iter().any(|c| c + glance == col) && eye_rows.contains(&row);
            if inside && !eye {
                dots.push((x, y));
            }
        }
    }
    cr.new_path();
    let yaw = if mood == Mood::Working { t * 1.4 } else { -0.7 };
    let (lx, ly, lz) = (yaw.sin() * 0.8, 0.55, yaw.cos() * 0.5 + 0.6); // never fully behind
    let ll = (lx * lx + ly * ly + lz * lz).sqrt();
    for (x, y) in dots {
        let (u, v) = ((x - 50.0) / 50.0, (50.0 - y) / 50.0);
        let z = (1.0 - u * u - v * v).max(0.2).sqrt();
        let nl = (u * u + v * v + z * z).sqrt();
        let mut shade = 0.3 + 0.7 * ((u * lx + v * ly + z * lz) / (nl * ll)).max(0.0);
        if mood == Mood::Needs {
            shade *= 0.6 + 0.4 * (0.5 + 0.5 * ((u * u + v * v).sqrt() * 9.0 - t * 5.0).sin());
        }
        cr.arc(x, y, step * 0.42 * (0.55 + 0.45 * shade), 0.0, 2.0 * PI);
        let alpha = if cells < 13 {
            0.4 + 0.4 * shade
        } else {
            0.2 + 0.4 * (shade / 0.7).min(1.0)
        };
        cr.set_source_rgba(ink.0, ink.1, ink.2, alpha);
        cr.fill_preserve().ok();
        if shade > 0.6 {
            cr.set_source_rgba(r, g, b, (shade - 0.6) / 0.4);
            cr.fill_preserve().ok();
        }
        cr.new_path();
    }
    cr.restore().ok();
}

type Part = (String, String, Mood);

fn part(b: &Value, animated: bool) -> Part {
    (
        b["avatarShape"].as_str().unwrap_or("blob").to_owned(),
        b["avatarColor"].as_str().unwrap_or("blue").to_owned(),
        if animated { mood(b) } else { Mood::Idle },
    )
}

#[derive(Clone, Copy, PartialEq)]
enum Badge {
    None,
    Unread,
    Needs,
}

/// One character in a fixed look.
pub fn shape(shape: &str, color: &str, size: i32, mood: Mood) -> gtk::DrawingArea {
    area(
        vec![(shape.to_owned(), color.to_owned(), mood)],
        size,
        Badge::None,
    )
}

/// A bot's character, or for a group its first two members, one tucked behind the other.
pub fn of(bots: &HashMap<String, Value>, b: &Value, size: i32, animated: bool) -> gtk::DrawingArea {
    build(bots, b, size, animated, Badge::None)
}

/// The roster avatar: a dot when unread, an amber "!" when it needs you.
pub fn with_status(bots: &HashMap<String, Value>, b: &Value, size: i32) -> gtk::DrawingArea {
    let badge = if b["status"] == "needsInput" {
        Badge::Needs
    } else if b["unread"].as_i64().unwrap_or(0) > 0 {
        Badge::Unread
    } else {
        Badge::None
    };
    build(bots, b, size, true, badge)
}

fn build(
    bots: &HashMap<String, Value>,
    b: &Value,
    size: i32,
    animated: bool,
    badge: Badge,
) -> gtk::DrawingArea {
    if b["kind"] == "group" {
        let parts = b["members"]
            .as_array()
            .into_iter()
            .flatten()
            .filter_map(|m| bots.get(m.as_str()?))
            .take(2)
            .map(|m| part(m, animated))
            .collect();
        area(parts, size, badge)
    } else {
        area(vec![part(b, animated)], size, badge)
    }
}

/// Several characters drawn side by side, overlapping by `overlap` px (the empty state's trio).
pub fn row(looks: &[(&str, &str, Mood)], size: i32, overlap: i32) -> gtk::DrawingArea {
    let n = i32::try_from(looks.len()).unwrap_or(1);
    let looks: Vec<Part> = looks
        .iter()
        .map(|(s, c, m)| ((*s).to_owned(), (*c).to_owned(), *m))
        .collect();
    let moving = looks.iter().any(|p| p.2 != Mood::Idle);
    let area = gtk::DrawingArea::builder()
        .content_width(size * n - overlap * (n - 1))
        .content_height(size)
        .halign(gtk::Align::Center)
        .build();
    let start = std::time::Instant::now();
    area.set_draw_func(move |area, cr, _, _| {
        let fg = area.color();
        let ink = (
            f64::from(fg.red()),
            f64::from(fg.green()),
            f64::from(fg.blue()),
        );
        let t = start.elapsed().as_secs_f64();
        for (i, (s, c, m)) in looks.iter().enumerate() {
            cr.save().ok();
            cr.translate(f64::from(size - overlap) * i as f64, 0.0);
            draw(cr, f64::from(size), s, c, ink, *m, t);
            cr.restore().ok();
        }
    });
    if moving {
        area.add_tick_callback(|a, _| {
            a.queue_draw();
            gtk::glib::ControlFlow::Continue
        });
    }
    area
}

fn area(parts: Vec<Part>, size: i32, badge: Badge) -> gtk::DrawingArea {
    let area = gtk::DrawingArea::builder()
        .content_width(size)
        .content_height(size)
        .valign(gtk::Align::Center)
        .halign(gtk::Align::Center)
        .build();
    let moving = parts.iter().any(|p| p.2 != Mood::Idle);
    let start = std::time::Instant::now();
    area.set_draw_func(move |area, cr, w, _| {
        let s = f64::from(w);
        let fg = area.color();
        let ink = (
            f64::from(fg.red()),
            f64::from(fg.green()),
            f64::from(fg.blue()),
        );
        let t = start.elapsed().as_secs_f64();
        match parts.as_slice() {
            [] => draw(cr, s, "blob", "gray", ink, Mood::Idle, t),
            [(shape, color, m)] => draw(cr, s, shape, color, ink, *m, t),
            [first, second, ..] => {
                let small = s * 0.66;
                // Second member top-right, behind; first bottom-left.
                for (p, (x, y)) in [(second, (s - small, 0.0)), (first, (0.0, s - small))] {
                    cr.save().ok();
                    cr.translate(x, y);
                    draw(cr, small, &p.0, &p.1, ink, p.2, t);
                    cr.restore().ok();
                }
            }
        }
        if badge != Badge::None {
            let d = s * if badge == Badge::Needs { 0.36 } else { 0.28 };
            let (cx, cy) = (s - d / 2.0, s - d / 2.0);
            let dark = adw::StyleManager::default().is_dark();
            let bg = if dark { 0.04 } else { 1.0 };
            cr.arc(cx, cy, d / 2.0 + 2.0, 0.0, 2.0 * PI);
            cr.set_source_rgb(bg, bg, bg);
            cr.fill().ok();
            cr.arc(cx, cy, d / 2.0, 0.0, 2.0 * PI);
            if badge == Badge::Needs {
                let (r, g, b) = rgb(0xF0A030);
                cr.set_source_rgb(r, g, b);
                cr.fill().ok();
                cr.set_source_rgb(1.0, 1.0, 1.0);
                cr.set_line_width(d * 0.16);
                cr.set_line_cap(gtk::cairo::LineCap::Round);
                cr.move_to(cx, cy - d * 0.22);
                cr.line_to(cx, cy + d * 0.06);
                cr.stroke().ok();
                cr.arc(cx, cy + d * 0.24, d * 0.08, 0.0, 2.0 * PI);
                cr.fill().ok();
            } else {
                cr.set_source_rgb(ink.0, ink.1, ink.2);
                cr.fill().ok();
            }
        }
    });
    if moving {
        area.add_tick_callback(|a, _| {
            a.queue_draw();
            gtk::glib::ControlFlow::Continue
        });
    }
    area
}

// Generated from the MIT-licensed Libraries.dev BotAvatarsKit paths.
fn library_shape(cr: &Context, shape: &str) -> bool {
    match shape {
        "clover" => {
            cr.move_to(26.530000, 22.380000);
            cr.curve_to(
                30.142084, 12.535613, 39.513861, 5.991568, 50.000000, 5.991568,
            );
            cr.curve_to(
                60.486139, 5.991568, 69.857916, 12.535613, 73.470000, 22.380000,
            );
            cr.curve_to(
                74.178637, 24.304456, 75.695544, 25.821363, 77.620000, 26.530000,
            );
            cr.curve_to(
                87.464387, 30.142084, 94.008432, 39.513861, 94.008432, 50.000000,
            );
            cr.curve_to(
                94.008432, 60.486139, 87.464387, 69.857916, 77.620000, 73.470000,
            );
            cr.curve_to(
                75.695544, 74.178637, 74.178637, 75.695544, 73.470000, 77.620000,
            );
            cr.curve_to(
                69.857916, 87.464387, 60.486139, 94.008432, 50.000000, 94.008432,
            );
            cr.curve_to(
                39.513861, 94.008432, 30.142084, 87.464387, 26.530000, 77.620000,
            );
            cr.curve_to(
                25.821363, 75.695544, 24.304456, 74.178637, 22.380000, 73.470000,
            );
            cr.curve_to(
                12.535613, 69.857916, 5.991568, 60.486139, 5.991568, 50.000000,
            );
            cr.curve_to(
                5.991568, 39.513861, 12.535613, 30.142084, 22.380000, 26.530000,
            );
            cr.curve_to(
                24.304456, 25.821363, 25.821363, 24.304456, 26.530000, 22.380000,
            );
            cr.close_path();
        }
        "flower" => {
            cr.move_to(31.200000, 19.820000);
            cr.curve_to(
                34.454206, 12.335167, 41.838347, 7.493738, 50.000000, 7.493738,
            );
            cr.curve_to(
                58.161653, 7.493738, 65.545794, 12.335167, 68.800000, 19.820000,
            );
            cr.curve_to(
                69.524618, 21.483762, 71.093815, 22.624301, 72.900000, 22.800000,
            );
            cr.curve_to(
                81.017957, 23.588651, 87.896137, 29.114634, 90.415380, 36.871993,
            );
            cr.curve_to(
                92.934623, 44.629352, 90.615617, 53.142169, 84.510000, 58.550000,
            );
            cr.curve_to(
                83.154279, 59.754811, 82.557304, 61.599312, 82.950000, 63.370000,
            );
            cr.curve_to(
                84.713237, 71.335307, 81.585684, 79.587990, 74.986220, 84.384049,
            );
            cr.curve_to(
                68.386755, 89.180109, 59.571627, 89.606586, 52.540000, 85.470000,
            );
            cr.curve_to(
                50.972794, 84.545714, 49.027206, 84.545714, 47.460000, 85.470000,
            );
            cr.curve_to(
                40.428373, 89.606586, 31.613245, 89.180109, 25.013780, 84.384049,
            );
            cr.curve_to(
                18.414316, 79.587990, 15.286763, 71.335307, 17.050000, 63.370000,
            );
            cr.curve_to(
                17.442696, 61.599312, 16.845721, 59.754811, 15.490000, 58.550000,
            );
            cr.curve_to(
                9.384383, 53.142169, 7.065377, 44.629352, 9.584620, 36.871993,
            );
            cr.curve_to(
                12.103863, 29.114634, 18.982043, 23.588651, 27.100000, 22.800000,
            );
            cr.curve_to(
                28.906185, 22.624301, 30.475382, 21.483762, 31.200000, 19.820000,
            );
            cr.close_path();
        }
        "triangle" => {
            cr.move_to(38.750000, 27.430000);
            cr.curve_to(
                41.074394, 23.415907, 45.361492, 20.944407, 50.000000, 20.944407,
            );
            cr.curve_to(
                54.638508, 20.944407, 58.925606, 23.415907, 61.250000, 27.430000,
            );
            cr.line_to(82.700000, 64.490000);
            cr.curve_to(
                85.026604, 68.511541, 85.030151, 73.469028, 82.709303, 77.493893,
            );
            cr.curve_to(
                80.388456, 81.518759, 76.096060, 83.999088, 71.450000, 84.000000,
            );
            cr.line_to(28.550000, 84.000000);
            cr.curve_to(
                23.903940, 83.999088, 19.611544, 81.518759, 17.290697, 77.493893,
            );
            cr.curve_to(
                14.969849, 73.469028, 14.973396, 68.511541, 17.300000, 64.490000,
            );
            cr.line_to(38.750000, 27.430000);
            cr.close_path();
        }
        "square" => {
            cr.move_to(93.000000, 50.000000);
            cr.curve_to(
                93.000000, 53.660000, 92.960000, 58.230000, 92.880000, 60.970000,
            );
            cr.curve_to(
                92.800000, 63.710000, 92.670000, 64.810000, 92.510000, 66.440000,
            );
            cr.curve_to(
                92.350000, 68.080000, 92.150000, 69.440000, 91.900000, 70.770000,
            );
            cr.curve_to(
                91.660000, 72.100000, 91.370000, 73.300000, 91.040000, 74.440000,
            );
            cr.curve_to(
                90.720000, 75.580000, 90.350000, 76.630000, 89.940000, 77.630000,
            );
            cr.curve_to(
                89.530000, 78.630000, 89.070000, 79.550000, 88.580000, 80.430000,
            );
            cr.curve_to(
                88.080000, 81.310000, 87.540000, 82.130000, 86.960000, 82.900000,
            );
            cr.curve_to(
                86.370000, 83.670000, 85.750000, 84.390000, 85.070000, 85.070000,
            );
            cr.curve_to(
                84.390000, 85.750000, 83.670000, 86.370000, 82.900000, 86.960000,
            );
            cr.curve_to(
                82.130000, 87.540000, 81.310000, 88.080000, 80.430000, 88.580000,
            );
            cr.curve_to(
                79.550000, 89.070000, 78.630000, 89.530000, 77.630000, 89.940000,
            );
            cr.curve_to(
                76.630000, 90.350000, 75.580000, 90.720000, 74.440000, 91.040000,
            );
            cr.curve_to(
                73.300000, 91.370000, 72.100000, 91.660000, 70.770000, 91.900000,
            );
            cr.curve_to(
                69.440000, 92.150000, 68.080000, 92.350000, 66.440000, 92.510000,
            );
            cr.curve_to(
                64.810000, 92.670000, 63.710000, 92.800000, 60.970000, 92.880000,
            );
            cr.curve_to(
                58.230000, 92.960000, 53.660000, 93.000000, 50.000000, 93.000000,
            );
            cr.curve_to(
                46.340000, 93.000000, 41.770000, 92.960000, 39.030000, 92.880000,
            );
            cr.curve_to(
                36.290000, 92.800000, 35.190000, 92.670000, 33.560000, 92.510000,
            );
            cr.curve_to(
                31.920000, 92.350000, 30.560000, 92.150000, 29.230000, 91.900000,
            );
            cr.curve_to(
                27.900000, 91.660000, 26.700000, 91.370000, 25.560000, 91.040000,
            );
            cr.curve_to(
                24.420000, 90.720000, 23.370000, 90.350000, 22.370000, 89.940000,
            );
            cr.curve_to(
                21.370000, 89.530000, 20.450000, 89.070000, 19.570000, 88.580000,
            );
            cr.curve_to(
                18.690000, 88.080000, 17.870000, 87.540000, 17.100000, 86.960000,
            );
            cr.curve_to(
                16.330000, 86.370000, 15.610000, 85.750000, 14.930000, 85.070000,
            );
            cr.curve_to(
                14.250000, 84.390000, 13.630000, 83.670000, 13.040000, 82.900000,
            );
            cr.curve_to(
                12.460000, 82.130000, 11.920000, 81.310000, 11.420000, 80.430000,
            );
            cr.curve_to(
                10.930000, 79.550000, 10.470000, 78.630000, 10.060000, 77.630000,
            );
            cr.curve_to(
                9.650000, 76.630000, 9.280000, 75.580000, 8.960000, 74.440000,
            );
            cr.curve_to(
                8.630000, 73.300000, 8.340000, 72.100000, 8.100000, 70.770000,
            );
            cr.curve_to(
                7.850000, 69.440000, 7.650000, 68.080000, 7.490000, 66.440000,
            );
            cr.curve_to(
                7.330000, 64.810000, 7.200000, 63.710000, 7.120000, 60.970000,
            );
            cr.curve_to(
                7.040000, 58.230000, 7.000000, 53.660000, 7.000000, 50.000000,
            );
            cr.curve_to(
                7.000000, 46.340000, 7.040000, 41.770000, 7.120000, 39.030000,
            );
            cr.curve_to(
                7.200000, 36.290000, 7.330000, 35.190000, 7.490000, 33.560000,
            );
            cr.curve_to(
                7.650000, 31.920000, 7.850000, 30.560000, 8.100000, 29.230000,
            );
            cr.curve_to(
                8.340000, 27.900000, 8.630000, 26.700000, 8.960000, 25.560000,
            );
            cr.curve_to(
                9.280000, 24.420000, 9.650000, 23.370000, 10.060000, 22.370000,
            );
            cr.curve_to(
                10.470000, 21.370000, 10.930000, 20.450000, 11.420000, 19.570000,
            );
            cr.curve_to(
                11.920000, 18.690000, 12.460000, 17.870000, 13.040000, 17.100000,
            );
            cr.curve_to(
                13.630000, 16.330000, 14.250000, 15.610000, 14.930000, 14.930000,
            );
            cr.curve_to(
                15.610000, 14.250000, 16.330000, 13.630000, 17.100000, 13.040000,
            );
            cr.curve_to(
                17.870000, 12.460000, 18.690000, 11.920000, 19.570000, 11.420000,
            );
            cr.curve_to(
                20.450000, 10.930000, 21.370000, 10.470000, 22.370000, 10.060000,
            );
            cr.curve_to(
                23.370000, 9.650000, 24.420000, 9.280000, 25.560000, 8.960000,
            );
            cr.curve_to(
                26.700000, 8.630000, 27.900000, 8.340000, 29.230000, 8.100000,
            );
            cr.curve_to(
                30.560000, 7.850000, 31.920000, 7.650000, 33.560000, 7.490000,
            );
            cr.curve_to(
                35.190000, 7.330000, 36.290000, 7.200000, 39.030000, 7.120000,
            );
            cr.curve_to(
                41.770000, 7.040000, 46.340000, 7.000000, 50.000000, 7.000000,
            );
            cr.curve_to(
                53.660000, 7.000000, 58.230000, 7.040000, 60.970000, 7.120000,
            );
            cr.curve_to(
                63.710000, 7.200000, 64.810000, 7.330000, 66.440000, 7.490000,
            );
            cr.curve_to(
                68.080000, 7.650000, 69.440000, 7.850000, 70.770000, 8.100000,
            );
            cr.curve_to(
                72.100000, 8.340000, 73.300000, 8.630000, 74.440000, 8.960000,
            );
            cr.curve_to(
                75.580000, 9.280000, 76.630000, 9.650000, 77.630000, 10.060000,
            );
            cr.curve_to(
                78.630000, 10.470000, 79.550000, 10.930000, 80.430000, 11.420000,
            );
            cr.curve_to(
                81.310000, 11.920000, 82.130000, 12.460000, 82.900000, 13.040000,
            );
            cr.curve_to(
                83.670000, 13.630000, 84.390000, 14.250000, 85.070000, 14.930000,
            );
            cr.curve_to(
                85.750000, 15.610000, 86.370000, 16.330000, 86.960000, 17.100000,
            );
            cr.curve_to(
                87.540000, 17.870000, 88.080000, 18.690000, 88.580000, 19.570000,
            );
            cr.curve_to(
                89.070000, 20.450000, 89.530000, 21.370000, 89.940000, 22.370000,
            );
            cr.curve_to(
                90.350000, 23.370000, 90.720000, 24.420000, 91.040000, 25.560000,
            );
            cr.curve_to(
                91.370000, 26.700000, 91.660000, 27.900000, 91.900000, 29.230000,
            );
            cr.curve_to(
                92.150000, 30.560000, 92.350000, 31.920000, 92.510000, 33.560000,
            );
            cr.curve_to(
                92.670000, 35.190000, 92.800000, 36.290000, 92.880000, 39.030000,
            );
            cr.curve_to(
                92.960000, 41.770000, 93.000000, 46.340000, 93.000000, 50.000000,
            );
            cr.close_path();
        }
        "blob" => {
            cr.move_to(93.920000, 50.000000);
            cr.curve_to(
                94.180000, 51.900000, 94.240000, 53.900000, 93.990000, 55.790000,
            );
            cr.curve_to(
                93.730000, 57.680000, 93.180000, 59.610000, 92.390000, 61.360000,
            );
            cr.curve_to(
                91.600000, 63.100000, 90.480000, 64.780000, 89.270000, 66.270000,
            );
            cr.curve_to(
                88.070000, 67.760000, 86.580000, 69.080000, 85.140000, 70.290000,
            );
            cr.curve_to(
                83.700000, 71.490000, 82.100000, 72.500000, 80.620000, 73.500000,
            );
            cr.curve_to(
                79.140000, 74.490000, 77.640000, 75.340000, 76.240000, 76.240000,
            );
            cr.curve_to(
                74.840000, 77.150000, 73.510000, 78.000000, 72.200000, 78.930000,
            );
            cr.curve_to(
                70.880000, 79.860000, 69.660000, 80.830000, 68.360000, 81.800000,
            );
            cr.curve_to(
                67.060000, 82.760000, 65.780000, 83.820000, 64.390000, 84.740000,
            );
            cr.curve_to(
                63.000000, 85.670000, 61.550000, 86.630000, 60.010000, 87.350000,
            );
            cr.curve_to(
                58.470000, 88.080000, 56.820000, 88.730000, 55.150000, 89.100000,
            );
            cr.curve_to(
                53.480000, 89.470000, 51.710000, 89.640000, 50.000000, 89.570000,
            );
            cr.curve_to(
                48.290000, 89.500000, 46.550000, 89.160000, 44.910000, 88.680000,
            );
            cr.curve_to(
                43.270000, 88.210000, 41.670000, 87.470000, 40.160000, 86.720000,
            );
            cr.curve_to(
                38.650000, 85.960000, 37.240000, 85.020000, 35.860000, 84.130000,
            );
            cr.curve_to(
                34.480000, 83.240000, 33.190000, 82.290000, 31.890000, 81.370000,
            );
            cr.curve_to(
                30.580000, 80.460000, 29.320000, 79.560000, 28.030000, 78.630000,
            );
            cr.curve_to(
                26.740000, 77.710000, 25.440000, 76.820000, 24.160000, 75.840000,
            );
            cr.curve_to(
                22.880000, 74.860000, 21.570000, 73.870000, 20.360000, 72.740000,
            );
            cr.curve_to(
                19.150000, 71.620000, 17.950000, 70.420000, 16.910000, 69.100000,
            );
            cr.curve_to(
                15.880000, 67.790000, 14.920000, 66.350000, 14.150000, 64.850000,
            );
            cr.curve_to(
                13.380000, 63.350000, 12.760000, 61.730000, 12.290000, 60.100000,
            );
            cr.curve_to(
                11.810000, 58.480000, 11.520000, 56.780000, 11.290000, 55.100000,
            );
            cr.curve_to(
                11.060000, 53.410000, 10.980000, 51.710000, 10.910000, 50.000000,
            );
            cr.curve_to(
                10.830000, 48.290000, 10.830000, 46.590000, 10.830000, 44.840000,
            );
            cr.curve_to(
                10.840000, 43.100000, 10.850000, 41.340000, 10.930000, 39.530000,
            );
            cr.curve_to(
                11.020000, 37.720000, 11.090000, 35.860000, 11.340000, 33.990000,
            );
            cr.curve_to(
                11.590000, 32.120000, 11.880000, 30.160000, 12.430000, 28.310000,
            );
            cr.curve_to(
                12.990000, 26.460000, 13.690000, 24.560000, 14.660000, 22.880000,
            );
            cr.curve_to(
                15.640000, 21.210000, 16.860000, 19.580000, 18.270000, 18.270000,
            );
            cr.curve_to(
                19.690000, 16.960000, 21.400000, 15.840000, 23.170000, 15.030000,
            );
            cr.curve_to(
                24.930000, 14.220000, 26.950000, 13.710000, 28.890000, 13.430000,
            );
            cr.curve_to(
                30.830000, 13.150000, 32.900000, 13.210000, 34.820000, 13.360000,
            );
            cr.curve_to(
                36.740000, 13.500000, 38.660000, 13.920000, 40.430000, 14.280000,
            );
            cr.curve_to(
                42.200000, 14.650000, 43.870000, 15.160000, 45.460000, 15.540000,
            );
            cr.curve_to(
                47.060000, 15.930000, 48.520000, 16.310000, 50.000000, 16.580000,
            );
            cr.curve_to(
                51.480000, 16.850000, 52.870000, 17.020000, 54.320000, 17.170000,
            );
            cr.curve_to(
                55.770000, 17.320000, 57.220000, 17.360000, 58.710000, 17.490000,
            );
            cr.curve_to(
                60.200000, 17.620000, 61.740000, 17.700000, 63.280000, 17.950000,
            );
            cr.curve_to(
                64.810000, 18.190000, 66.390000, 18.500000, 67.910000, 18.980000,
            );
            cr.curve_to(
                69.430000, 19.460000, 70.950000, 20.080000, 72.380000, 20.830000,
            );
            cr.curve_to(
                73.810000, 21.580000, 75.190000, 22.500000, 76.500000, 23.500000,
            );
            cr.curve_to(
                77.810000, 24.500000, 79.030000, 25.630000, 80.220000, 26.810000,
            );
            cr.curve_to(
                81.410000, 27.990000, 82.540000, 29.250000, 83.650000, 30.570000,
            );
            cr.curve_to(
                84.760000, 31.890000, 85.850000, 33.260000, 86.890000, 34.720000,
            );
            cr.curve_to(
                87.930000, 36.180000, 88.980000, 37.690000, 89.900000, 39.310000,
            );
            cr.curve_to(
                90.820000, 40.920000, 91.730000, 42.640000, 92.400000, 44.420000,
            );
            cr.curve_to(
                93.070000, 46.200000, 93.660000, 48.100000, 93.920000, 50.000000,
            );
            cr.close_path();
        }
        "ghost" => {
            cr.move_to(17.000000, 50.000000);
            cr.curve_to(
                17.000000, 31.780000, 31.780000, 17.000000, 50.000000, 17.000000,
            );
            cr.curve_to(
                68.220000, 17.000000, 83.000000, 31.780000, 83.000000, 50.000000,
            );
            cr.line_to(83.000000, 81.500000);
            quad_to(cr, (72.000000, 93.500000), (61.000000, 81.500000));
            quad_to(cr, (50.000000, 93.500000), (39.000000, 81.500000));
            quad_to(cr, (28.000000, 93.500000), (17.000000, 81.500000));
            cr.close_path();
        }
        "circle" => {
            cr.move_to(50.000000, 8.000000);
            cr.curve_to(
                73.195959, 8.000000, 92.000000, 26.804041, 92.000000, 50.000000,
            );
            cr.curve_to(
                92.000000, 73.195959, 73.195959, 92.000000, 50.000000, 92.000000,
            );
            cr.curve_to(
                26.804041, 92.000000, 8.000000, 73.195959, 8.000000, 50.000000,
            );
            cr.curve_to(
                8.000000, 26.804041, 26.804041, 8.000000, 50.000000, 8.000000,
            );
            cr.close_path();
        }
        "drop" => {
            cr.move_to(50.000000, 8.500000);
            cr.curve_to(
                52.200000, 8.500000, 53.400000, 10.300000, 56.400000, 15.200000,
            );
            cr.curve_to(
                62.900000, 25.500000, 84.000000, 44.600000, 84.000000, 61.500000,
            );
            cr.curve_to(
                84.000000, 80.300000, 68.800000, 92.000000, 50.000000, 92.000000,
            );
            cr.curve_to(
                31.200000, 92.000000, 16.000000, 80.300000, 16.000000, 61.500000,
            );
            cr.curve_to(
                16.000000, 44.600000, 37.100000, 25.500000, 43.600000, 15.200000,
            );
            cr.curve_to(
                46.600000, 10.300000, 47.800000, 8.500000, 50.000000, 8.500000,
            );
            cr.close_path();
        }
        "star" => {
            cr.move_to(45.770000, 9.700000);
            cr.curve_to(
                46.685618, 8.247192, 48.282732, 7.365914, 50.000000, 7.365914,
            );
            cr.curve_to(
                51.717268, 7.365914, 53.314382, 8.247192, 54.230000, 9.700000,
            );
            cr.line_to(65.020000, 26.810000);
            cr.curve_to(
                65.567624, 27.675973, 66.426676, 28.298786, 67.420000, 28.550000,
            );
            cr.line_to(87.020000, 33.530000);
            cr.curve_to(
                88.681731, 33.953903, 90.010270, 35.199870, 90.539786, 36.831021,
            );
            cr.curve_to(
                91.069301, 38.462173, 90.725904, 40.250895, 89.630000, 41.570000,
            );
            cr.line_to(76.700000, 57.120000);
            cr.curve_to(
                76.043248, 57.907350, 75.713914, 58.916831, 75.780000, 59.940000,
            );
            cr.line_to(77.110000, 80.120000);
            cr.curve_to(
                77.223124, 81.834561, 76.447920, 83.487097, 75.057137, 84.496175,
            );
            cr.curve_to(
                73.666355, 85.505254, 71.854855, 85.729495, 70.260000, 85.090000,
            );
            cr.line_to(51.480000, 77.590000);
            cr.curve_to(
                50.529632, 77.211503, 49.470368, 77.211503, 48.520000, 77.590000,
            );
            cr.line_to(29.740000, 85.090000);
            cr.curve_to(
                28.145145, 85.729495, 26.333645, 85.505254, 24.942863, 84.496175,
            );
            cr.curve_to(
                23.552080, 83.487097, 22.776876, 81.834561, 22.890000, 80.120000,
            );
            cr.line_to(24.220000, 59.940000);
            cr.curve_to(
                24.286086, 58.916831, 23.956752, 57.907350, 23.300000, 57.120000,
            );
            cr.line_to(10.370000, 41.570000);
            cr.curve_to(
                9.274096, 40.250895, 8.930699, 38.462173, 9.460214, 36.831021,
            );
            cr.curve_to(
                9.989730, 35.199870, 11.318269, 33.953903, 12.980000, 33.530000,
            );
            cr.line_to(32.580000, 28.550000);
            cr.curve_to(
                33.573324, 28.298786, 34.432376, 27.675973, 34.980000, 26.810000,
            );
            cr.line_to(45.770000, 9.700000);
            cr.close_path();
        }
        "droid" => {
            cr.move_to(16.000000, 50.000000);
            cr.curve_to(
                16.000000, 38.950000, 24.950000, 30.000000, 36.000000, 30.000000,
            );
            cr.line_to(64.000000, 30.000000);
            cr.curve_to(
                75.050000, 30.000000, 84.000000, 38.950000, 84.000000, 50.000000,
            );
            cr.line_to(84.000000, 70.000000);
            cr.curve_to(
                84.000000, 81.050000, 75.050000, 90.000000, 64.000000, 90.000000,
            );
            cr.line_to(36.000000, 90.000000);
            cr.curve_to(
                24.950000, 90.000000, 16.000000, 81.050000, 16.000000, 70.000000,
            );
            cr.close_path();
            cr.move_to(4.000000, 62.000000);
            cr.curve_to(
                4.000000, 58.134007, 7.134007, 55.000000, 11.000000, 55.000000,
            );
            cr.curve_to(
                14.865993, 55.000000, 18.000000, 58.134007, 18.000000, 62.000000,
            );
            cr.curve_to(
                18.000000, 65.865993, 14.865993, 69.000000, 11.000000, 69.000000,
            );
            cr.curve_to(
                7.134007, 69.000000, 4.000000, 65.865993, 4.000000, 62.000000,
            );
            cr.close_path();
            cr.move_to(82.000000, 62.000000);
            cr.curve_to(
                82.000000, 58.134007, 85.134007, 55.000000, 89.000000, 55.000000,
            );
            cr.curve_to(
                92.865993, 55.000000, 96.000000, 58.134007, 96.000000, 62.000000,
            );
            cr.curve_to(
                96.000000, 65.865993, 92.865993, 69.000000, 89.000000, 69.000000,
            );
            cr.curve_to(
                85.134007, 69.000000, 82.000000, 65.865993, 82.000000, 62.000000,
            );
            cr.close_path();
        }
        "mech" => {
            cr.move_to(10.000000, 48.000000);
            cr.curve_to(
                10.000000, 38.060000, 18.060000, 30.000000, 28.000000, 30.000000,
            );
            cr.line_to(72.000000, 30.000000);
            cr.curve_to(
                81.940000, 30.000000, 90.000000, 38.060000, 90.000000, 48.000000,
            );
            cr.line_to(90.000000, 70.000000);
            cr.curve_to(
                90.000000, 79.940000, 81.940000, 88.000000, 72.000000, 88.000000,
            );
            cr.line_to(28.000000, 88.000000);
            cr.curve_to(
                18.060000, 88.000000, 10.000000, 79.940000, 10.000000, 70.000000,
            );
            cr.close_path();
            cr.move_to(3.000000, 54.000000);
            cr.curve_to(
                3.000000, 51.790000, 4.790000, 50.000000, 7.000000, 50.000000,
            );
            cr.line_to(11.000000, 50.000000);
            cr.line_to(11.000000, 72.000000);
            cr.line_to(7.000000, 72.000000);
            cr.curve_to(
                4.790000, 72.000000, 3.000000, 70.210000, 3.000000, 68.000000,
            );
            cr.close_path();
            cr.move_to(89.000000, 50.000000);
            cr.line_to(93.000000, 50.000000);
            cr.curve_to(
                95.210000, 50.000000, 97.000000, 51.790000, 97.000000, 54.000000,
            );
            cr.line_to(97.000000, 68.000000);
            cr.curve_to(
                97.000000, 70.210000, 95.210000, 72.000000, 93.000000, 72.000000,
            );
            cr.line_to(89.000000, 72.000000);
            cr.close_path();
        }
        "alien" => {
            cr.move_to(50.000000, 10.000000);
            cr.curve_to(
                70.000000, 10.000000, 83.000000, 27.000000, 83.000000, 46.000000,
            );
            cr.curve_to(
                83.000000, 65.000000, 64.000000, 92.000000, 50.000000, 92.000000,
            );
            cr.curve_to(
                36.000000, 92.000000, 17.000000, 65.000000, 17.000000, 46.000000,
            );
            cr.curve_to(
                17.000000, 27.000000, 30.000000, 10.000000, 50.000000, 10.000000,
            );
            cr.close_path();
        }
        "hexagon" => {
            cr.move_to(91.400000, 45.500000);
            cr.curve_to(
                93.007695, 48.284610, 93.007695, 51.715390, 91.400000, 54.500000,
            );
            cr.line_to(74.600000, 83.610000);
            cr.curve_to(
                72.991274, 86.396396, 70.017452, 88.112063, 66.800000, 88.110000,
            );
            cr.line_to(33.200000, 88.110000);
            cr.curve_to(
                29.982548, 88.112063, 27.008726, 86.396396, 25.400000, 83.610000,
            );
            cr.line_to(8.600000, 54.500000);
            cr.curve_to(
                6.992305, 51.715390, 6.992305, 48.284610, 8.600000, 45.500000,
            );
            cr.line_to(25.400000, 16.390000);
            cr.curve_to(
                27.008726, 13.603604, 29.982548, 11.887937, 33.200000, 11.890000,
            );
            cr.line_to(66.800000, 11.890000);
            cr.curve_to(
                70.017452, 11.887937, 72.991274, 13.603604, 74.600000, 16.390000,
            );
            cr.line_to(91.400000, 45.500000);
            cr.close_path();
        }
        "cat" => {
            cr.move_to(50.000000, 20.000000);
            cr.curve_to(
                69.882251, 20.000000, 86.000000, 36.117749, 86.000000, 56.000000,
            );
            cr.curve_to(
                86.000000, 75.882251, 69.882251, 92.000000, 50.000000, 92.000000,
            );
            cr.curve_to(
                30.117749, 92.000000, 14.000000, 75.882251, 14.000000, 56.000000,
            );
            cr.curve_to(
                14.000000, 36.117749, 30.117749, 20.000000, 50.000000, 20.000000,
            );
            cr.close_path();
            cr.move_to(24.720000, 44.640000);
            cr.curve_to(
                23.307804, 45.831136, 21.311058, 46.038121, 19.684565, 45.161978,
            );
            cr.curve_to(
                18.058073, 44.285835, 17.132327, 42.504591, 17.350000, 40.670000,
            );
            cr.line_to(20.210000, 16.660000);
            cr.curve_to(
                20.388333, 15.172328, 21.295413, 13.870993, 22.629482, 13.188913,
            );
            cr.curve_to(
                23.963550, 12.506833, 25.549601, 12.533484, 26.860000, 13.260000,
            );
            cr.line_to(42.300000, 21.830000);
            cr.curve_to(
                43.596286, 22.547105, 44.456589, 23.856272, 44.600434, 25.330689,
            );
            cr.curve_to(
                44.744280, 26.805106, 44.153238, 28.255868, 43.020000, 29.210000,
            );
            cr.line_to(24.720000, 44.640000);
            cr.close_path();
            cr.move_to(82.650000, 40.670000);
            cr.curve_to(
                82.867673, 42.504591, 81.941927, 44.285835, 80.315435, 45.161978,
            );
            cr.curve_to(
                78.688942, 46.038121, 76.692196, 45.831136, 75.280000, 44.640000,
            );
            cr.line_to(56.980000, 29.210000);
            cr.curve_to(
                55.846762, 28.255868, 55.255720, 26.805106, 55.399566, 25.330689,
            );
            cr.curve_to(
                55.543411, 23.856272, 56.403714, 22.547105, 57.700000, 21.830000,
            );
            cr.line_to(73.140000, 13.260000);
            cr.curve_to(
                74.450399, 12.533484, 76.036450, 12.506833, 77.370518, 13.188913,
            );
            cr.curve_to(
                78.704587, 13.870993, 79.611667, 15.172328, 79.790000, 16.660000,
            );
            cr.line_to(82.650000, 40.670000);
            cr.close_path();
        }
        "cloud" => {
            cr.move_to(19.000000, 44.000000);
            cr.curve_to(
                19.000000, 30.192881, 30.192881, 19.000000, 44.000000, 19.000000,
            );
            cr.curve_to(
                57.807119, 19.000000, 69.000000, 30.192881, 69.000000, 44.000000,
            );
            cr.curve_to(
                69.000000, 57.807119, 57.807119, 69.000000, 44.000000, 69.000000,
            );
            cr.curve_to(
                30.192881, 69.000000, 19.000000, 57.807119, 19.000000, 44.000000,
            );
            cr.close_path();
            cr.move_to(47.000000, 50.000000);
            cr.curve_to(
                47.000000, 38.402020, 56.402020, 29.000000, 68.000000, 29.000000,
            );
            cr.curve_to(
                79.597980, 29.000000, 89.000000, 38.402020, 89.000000, 50.000000,
            );
            cr.curve_to(
                89.000000, 61.597980, 79.597980, 71.000000, 68.000000, 71.000000,
            );
            cr.curve_to(
                56.402020, 71.000000, 47.000000, 61.597980, 47.000000, 50.000000,
            );
            cr.close_path();
            cr.move_to(7.000000, 68.000000);
            cr.curve_to(
                7.000000, 58.611159, 14.611159, 51.000000, 24.000000, 51.000000,
            );
            cr.curve_to(
                33.388841, 51.000000, 41.000000, 58.611159, 41.000000, 68.000000,
            );
            cr.curve_to(
                41.000000, 77.388841, 33.388841, 85.000000, 24.000000, 85.000000,
            );
            cr.curve_to(
                14.611159, 85.000000, 7.000000, 77.388841, 7.000000, 68.000000,
            );
            cr.close_path();
            cr.move_to(32.000000, 73.000000);
            cr.curve_to(
                32.000000, 63.058875, 40.058875, 55.000000, 50.000000, 55.000000,
            );
            cr.curve_to(
                59.941125, 55.000000, 68.000000, 63.058875, 68.000000, 73.000000,
            );
            cr.curve_to(
                68.000000, 82.941125, 59.941125, 91.000000, 50.000000, 91.000000,
            );
            cr.curve_to(
                40.058875, 91.000000, 32.000000, 82.941125, 32.000000, 73.000000,
            );
            cr.close_path();
            cr.move_to(60.000000, 70.000000);
            cr.curve_to(
                60.000000, 61.163444, 67.163444, 54.000000, 76.000000, 54.000000,
            );
            cr.curve_to(
                84.836556, 54.000000, 92.000000, 61.163444, 92.000000, 70.000000,
            );
            cr.curve_to(
                92.000000, 78.836556, 84.836556, 86.000000, 76.000000, 86.000000,
            );
            cr.curve_to(
                67.163444, 86.000000, 60.000000, 78.836556, 60.000000, 70.000000,
            );
            cr.close_path();
        }
        "pill" => {
            cr.move_to(28.000000, 28.000000);
            cr.line_to(72.000000, 28.000000);
            cr.curve_to(
                84.150000, 28.000000, 94.000000, 37.850000, 94.000000, 50.000000,
            );
            cr.curve_to(
                94.000000, 62.150000, 84.150000, 72.000000, 72.000000, 72.000000,
            );
            cr.line_to(28.000000, 72.000000);
            cr.curve_to(
                15.850000, 72.000000, 6.000000, 62.150000, 6.000000, 50.000000,
            );
            cr.curve_to(
                6.000000, 37.850000, 15.850000, 28.000000, 28.000000, 28.000000,
            );
            cr.close_path();
        }
        "pebble" => {
            cr.move_to(94.600000, 50.000000);
            cr.curve_to(
                94.710000, 51.920000, 94.560000, 53.930000, 94.170000, 55.820000,
            );
            cr.curve_to(
                93.790000, 57.700000, 93.130000, 59.600000, 92.280000, 61.330000,
            );
            cr.curve_to(
                91.440000, 63.060000, 90.320000, 64.720000, 89.100000, 66.190000,
            );
            cr.curve_to(
                87.870000, 67.670000, 86.410000, 69.010000, 84.920000, 70.160000,
            );
            cr.curve_to(
                83.420000, 71.310000, 81.750000, 72.290000, 80.110000, 73.100000,
            );
            cr.curve_to(
                78.470000, 73.920000, 76.730000, 74.550000, 75.060000, 75.060000,
            );
            cr.curve_to(
                73.390000, 75.580000, 71.700000, 75.910000, 70.100000, 76.200000,
            );
            cr.curve_to(
                68.500000, 76.480000, 66.930000, 76.620000, 65.450000, 76.760000,
            );
            cr.curve_to(
                63.960000, 76.900000, 62.550000, 76.940000, 61.200000, 77.030000,
            );
            cr.curve_to(
                59.840000, 77.110000, 58.570000, 77.160000, 57.310000, 77.260000,
            );
            cr.curve_to(
                56.050000, 77.360000, 54.860000, 77.480000, 53.640000, 77.630000,
            );
            cr.curve_to(
                52.420000, 77.790000, 51.240000, 77.980000, 50.000000, 78.180000,
            );
            cr.curve_to(
                48.760000, 78.390000, 47.520000, 78.640000, 46.200000, 78.850000,
            );
            cr.curve_to(
                44.890000, 79.060000, 43.530000, 79.300000, 42.110000, 79.460000,
            );
            cr.curve_to(
                40.690000, 79.610000, 39.200000, 79.750000, 37.670000, 79.770000,
            );
            cr.curve_to(
                36.140000, 79.780000, 34.540000, 79.740000, 32.950000, 79.540000,
            );
            cr.curve_to(
                31.350000, 79.330000, 29.700000, 79.030000, 28.100000, 78.550000,
            );
            cr.curve_to(
                26.490000, 78.070000, 24.860000, 77.450000, 23.330000, 76.670000,
            );
            cr.curve_to(
                21.800000, 75.880000, 20.290000, 74.940000, 18.920000, 73.850000,
            );
            cr.curve_to(
                17.540000, 72.770000, 16.230000, 71.510000, 15.080000, 70.160000,
            );
            cr.curve_to(
                13.940000, 68.800000, 12.900000, 67.290000, 12.040000, 65.720000,
            );
            cr.curve_to(
                11.170000, 64.160000, 10.450000, 62.460000, 9.910000, 60.740000,
            );
            cr.curve_to(
                9.360000, 59.030000, 8.980000, 57.220000, 8.760000, 55.430000,
            );
            cr.curve_to(
                8.550000, 53.640000, 8.500000, 51.800000, 8.600000, 50.000000,
            );
            cr.curve_to(
                8.710000, 48.200000, 8.980000, 46.390000, 9.380000, 44.650000,
            );
            cr.curve_to(
                9.790000, 42.910000, 10.350000, 41.190000, 11.020000, 39.560000,
            );
            cr.curve_to(
                11.700000, 37.920000, 12.520000, 36.340000, 13.430000, 34.850000,
            );
            cr.curve_to(
                14.340000, 33.370000, 15.390000, 31.960000, 16.500000, 30.660000,
            );
            cr.curve_to(
                17.610000, 29.360000, 18.840000, 28.150000, 20.110000, 27.070000,
            );
            cr.curve_to(
                21.390000, 25.980000, 22.760000, 25.000000, 24.150000, 24.150000,
            );
            cr.curve_to(
                25.540000, 23.300000, 27.010000, 22.560000, 28.480000, 21.950000,
            );
            cr.curve_to(
                29.940000, 21.330000, 31.460000, 20.850000, 32.950000, 20.460000,
            );
            cr.curve_to(
                34.440000, 20.080000, 35.950000, 19.830000, 37.430000, 19.660000,
            );
            cr.curve_to(
                38.910000, 19.480000, 40.380000, 19.430000, 41.810000, 19.430000,
            );
            cr.curve_to(
                43.240000, 19.430000, 44.640000, 19.530000, 46.010000, 19.660000,
            );
            cr.curve_to(
                47.370000, 19.780000, 48.700000, 19.980000, 50.000000, 20.180000,
            );
            cr.curve_to(
                51.300000, 20.390000, 52.570000, 20.630000, 53.830000, 20.870000,
            );
            cr.curve_to(
                55.100000, 21.110000, 56.340000, 21.370000, 57.600000, 21.620000,
            );
            cr.curve_to(
                58.870000, 21.870000, 60.130000, 22.120000, 61.430000, 22.390000,
            );
            cr.curve_to(
                62.740000, 22.660000, 64.070000, 22.930000, 65.450000, 23.240000,
            );
            cr.curve_to(
                66.830000, 23.560000, 68.250000, 23.880000, 69.720000, 24.300000,
            );
            cr.curve_to(
                71.190000, 24.720000, 72.710000, 25.170000, 74.250000, 25.750000,
            );
            cr.curve_to(
                75.780000, 26.340000, 77.370000, 27.000000, 78.910000, 27.810000,
            );
            cr.curve_to(
                80.460000, 28.630000, 82.040000, 29.560000, 83.500000, 30.660000,
            );
            cr.curve_to(
                84.970000, 31.750000, 86.430000, 33.000000, 87.700000, 34.380000,
            );
            cr.curve_to(
                88.980000, 35.770000, 90.190000, 37.320000, 91.170000, 38.970000,
            );
            cr.curve_to(
                92.140000, 40.620000, 92.980000, 42.430000, 93.560000, 44.270000,
            );
            cr.curve_to(
                94.130000, 46.100000, 94.500000, 48.080000, 94.600000, 50.000000,
            );
            cr.close_path();
        }
        "puddle" => {
            cr.move_to(85.340000, 50.000000);
            cr.curve_to(
                85.650000, 51.540000, 85.900000, 53.130000, 86.010000, 54.740000,
            );
            cr.curve_to(
                86.110000, 56.350000, 86.110000, 58.000000, 85.950000, 59.630000,
            );
            cr.curve_to(
                85.800000, 61.260000, 85.510000, 62.930000, 85.070000, 64.520000,
            );
            cr.curve_to(
                84.620000, 66.120000, 84.030000, 67.720000, 83.300000, 69.230000,
            );
            cr.curve_to(
                82.580000, 70.740000, 81.700000, 72.210000, 80.720000, 73.570000,
            );
            cr.curve_to(
                79.740000, 74.940000, 78.620000, 76.230000, 77.430000, 77.430000,
            );
            cr.curve_to(
                76.240000, 78.620000, 74.930000, 79.720000, 73.580000, 80.730000,
            );
            cr.curve_to(
                72.230000, 81.740000, 70.790000, 82.650000, 69.330000, 83.480000,
            );
            cr.curve_to(
                67.860000, 84.310000, 66.340000, 85.040000, 64.790000, 85.710000,
            );
            cr.curve_to(
                63.240000, 86.370000, 61.650000, 86.950000, 60.040000, 87.460000,
            );
            cr.curve_to(
                58.420000, 87.960000, 56.770000, 88.400000, 55.100000, 88.750000,
            );
            cr.curve_to(
                53.430000, 89.090000, 51.720000, 89.370000, 50.000000, 89.540000,
            );
            cr.curve_to(
                48.280000, 89.710000, 46.520000, 89.810000, 44.760000, 89.760000,
            );
            cr.curve_to(
                43.010000, 89.720000, 41.220000, 89.580000, 39.470000, 89.290000,
            );
            cr.curve_to(
                37.720000, 89.000000, 35.950000, 88.580000, 34.260000, 88.000000,
            );
            cr.curve_to(
                32.570000, 87.420000, 30.890000, 86.690000, 29.330000, 85.800000,
            );
            cr.curve_to(
                27.770000, 84.920000, 26.260000, 83.870000, 24.910000, 82.700000,
            );
            cr.curve_to(
                23.560000, 81.530000, 22.300000, 80.190000, 21.230000, 78.770000,
            );
            cr.curve_to(
                20.160000, 77.350000, 19.220000, 75.790000, 18.470000, 74.200000,
            );
            cr.curve_to(
                17.710000, 72.610000, 17.130000, 70.910000, 16.700000, 69.230000,
            );
            cr.curve_to(
                16.260000, 67.550000, 16.020000, 65.810000, 15.880000, 64.130000,
            );
            cr.curve_to(
                15.750000, 62.450000, 15.780000, 60.760000, 15.880000, 59.140000,
            );
            cr.curve_to(
                15.970000, 57.520000, 16.210000, 55.940000, 16.450000, 54.420000,
            );
            cr.curve_to(
                16.700000, 52.890000, 17.030000, 51.430000, 17.340000, 50.000000,
            );
            cr.curve_to(
                17.650000, 48.570000, 18.000000, 47.200000, 18.320000, 45.830000,
            );
            cr.curve_to(
                18.630000, 44.460000, 18.940000, 43.130000, 19.240000, 41.760000,
            );
            cr.curve_to(
                19.530000, 40.390000, 19.790000, 39.030000, 20.080000, 37.610000,
            );
            cr.curve_to(
                20.360000, 36.180000, 20.620000, 34.740000, 20.950000, 33.230000,
            );
            cr.curve_to(
                21.280000, 31.720000, 21.610000, 30.160000, 22.070000, 28.570000,
            );
            cr.curve_to(
                22.520000, 26.980000, 23.020000, 25.320000, 23.690000, 23.690000,
            );
            cr.curve_to(
                24.350000, 22.060000, 25.110000, 20.380000, 26.050000, 18.790000,
            );
            cr.curve_to(
                26.990000, 17.210000, 28.080000, 15.620000, 29.330000, 14.200000,
            );
            cr.curve_to(
                30.580000, 12.780000, 32.000000, 11.410000, 33.540000, 10.260000,
            );
            cr.curve_to(
                35.080000, 9.120000, 36.800000, 8.110000, 38.570000, 7.350000,
            );
            cr.curve_to(
                40.340000, 6.600000, 42.270000, 6.040000, 44.170000, 5.730000,
            );
            cr.curve_to(
                46.080000, 5.430000, 48.080000, 5.370000, 50.000000, 5.540000,
            );
            cr.curve_to(
                51.920000, 5.710000, 53.870000, 6.150000, 55.690000, 6.750000,
            );
            cr.curve_to(
                57.520000, 7.360000, 59.300000, 8.220000, 60.940000, 9.190000,
            );
            cr.curve_to(
                62.570000, 10.150000, 64.110000, 11.330000, 65.510000, 12.560000,
            );
            cr.curve_to(
                66.910000, 13.780000, 68.170000, 15.150000, 69.330000, 16.520000,
            );
            cr.curve_to(
                70.480000, 17.890000, 71.500000, 19.340000, 72.440000, 20.760000,
            );
            cr.curve_to(
                73.380000, 22.180000, 74.190000, 23.620000, 74.970000, 25.030000,
            );
            cr.curve_to(
                75.750000, 26.430000, 76.440000, 27.830000, 77.120000, 29.190000,
            );
            cr.curve_to(
                77.800000, 30.560000, 78.420000, 31.890000, 79.050000, 33.230000,
            );
            cr.curve_to(
                79.670000, 34.570000, 80.280000, 35.870000, 80.870000, 37.210000,
            );
            cr.curve_to(
                81.460000, 38.550000, 82.050000, 39.880000, 82.600000, 41.270000,
            );
            cr.curve_to(
                83.140000, 42.650000, 83.680000, 44.050000, 84.140000, 45.510000,
            );
            cr.curve_to(
                84.600000, 46.960000, 85.030000, 48.460000, 85.340000, 50.000000,
            );
            cr.close_path();
        }
        _ => return false,
    }
    true
}


-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-01-23 20:03:03

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE TYPE public."enum_RegistrationSessions_status" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');
CREATE TYPE public."enum_UniqueIds_status" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE public.enum_exam_attempts_status AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'AUTO_SUBMITTED', 'TERMINATED');
CREATE TYPE public.enum_questions_question_type AS ENUM ('MCQ', 'TEXT');
CREATE TYPE public.enum_violations_type AS ENUM ('TAB_SWITCH', 'FULLSCREEN_EXIT', 'MOUSE_LEAVE', 'DEBUGGER_DETECTED');



SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 871 (class 1247 OID 16618)
-- Name: enum_RegistrationSessions_status; Type: TYPE; Schema: public; Owner: postgres
--






--
-- TOC entry 901 (class 1247 OID 20063)
--


--
-- TOC entry 886 (class 1247 OID 19676)
-- Name: enum_exam_attempts_status; Type: TYPE; Schema: public; Owner: postgres
--






--
-- TOC entry 880 (class 1247 OID 19649)
-- Name: enum_questions_question_type; Type: TYPE; Schema: public; Owner: postgres
--






--
-- TOC entry 895 (class 1247 OID 19734)
-- Name: enum_violations_type; Type: TYPE; Schema: public; Owner: postgres
--






SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 221 (class 1259 OID 16625)
-- Name: RegistrationSessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RegistrationSessions" (
    id uuid NOT NULL,
    unique_id character varying(255) NOT NULL,
    session_token character varying(255) NOT NULL,
    status public."enum_RegistrationSessions_status" DEFAULT 'PENDING'::public."enum_RegistrationSessions_status",
    expires_at timestamp with time zone NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public."RegistrationSessions" OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16567)
-- Name: UniqueIds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UniqueIds" (
    id uuid NOT NULL,
    unique_id character varying(255) NOT NULL,
    student_name character varying(255),
    student_email character varying(255),
    is_used boolean DEFAULT false,
    status public."enum_UniqueIds_status" DEFAULT 'ACTIVE'::public."enum_UniqueIds_status" NOT NULL,
    generated_date timestamp with time zone,
    expiry_date timestamp with time zone,
    used_date timestamp with time zone,
    generated_by uuid,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    role integer DEFAULT 3 NOT NULL
);


ALTER TABLE public."UniqueIds" OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16589)
-- Name: Users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Users" (
    id uuid NOT NULL,
    unique_id character varying(255) NOT NULL,
    department_id uuid,
    program_id uuid,
    current_semester integer,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    college_roll_number character varying(255),
    role integer DEFAULT 3 NOT NULL,
    registered_date timestamp with time zone,
    email_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    otp character varying(255),
    otp_expires_at timestamp with time zone,
    dob date
);


ALTER TABLE public."Users" OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 19685)
-- Name: exam_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam_attempts (
    id uuid NOT NULL,
    student_id uuid NOT NULL,
    exam_id uuid NOT NULL,
    status public.enum_exam_attempts_status DEFAULT 'IN_PROGRESS'::public.enum_exam_attempts_status,
    start_time timestamp with time zone,
    end_time timestamp with time zone NOT NULL,
    assigned_questions jsonb NOT NULL,
    score double precision DEFAULT '0'::double precision,
    violation_count integer DEFAULT 0,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.exam_attempts OWNER TO postgres;

--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN exam_attempts.end_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exam_attempts.end_time IS 'Calculated expiration time';


--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 224
-- Name: COLUMN exam_attempts.assigned_questions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exam_attempts.assigned_questions IS 'Array of Question IDs assigned to this student for this attempt';


--
-- TOC entry 222 (class 1259 OID 19630)
-- Name: exams; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exams (
    id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    duration_minutes integer DEFAULT 60 NOT NULL,
    total_questions_to_ask integer DEFAULT 20 NOT NULL,
    passing_percentage double precision DEFAULT '40'::double precision NOT NULL,
    is_active boolean DEFAULT true,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.exams OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 19653)
-- Name: questions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.questions (
    id uuid NOT NULL,
    exam_id uuid NOT NULL,
    question_text text NOT NULL,
    question_type public.enum_questions_question_type DEFAULT 'MCQ'::public.enum_questions_question_type NOT NULL,
    options jsonb NOT NULL,
    correct_answer character varying(255) NOT NULL,
    marks integer DEFAULT 1,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.questions OWNER TO postgres;

--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 223
-- Name: COLUMN questions.correct_answer; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.questions.correct_answer IS 'The correct option string or index. Not sent to client.';


--
-- TOC entry 225 (class 1259 OID 19712)
-- Name: student_answers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_answers (
    id uuid NOT NULL,
    attempt_id uuid NOT NULL,
    question_id uuid NOT NULL,
    selected_option character varying(255),
    is_final boolean DEFAULT false,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.student_answers OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 19743)
-- Name: violations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.violations (
    id uuid NOT NULL,
    attempt_id uuid NOT NULL,
    type public.enum_violations_type NOT NULL,
    "timestamp" timestamp with time zone,
    metadata jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


ALTER TABLE public.violations OWNER TO postgres;

--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN violations.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.violations.metadata IS 'Any extra info like browser agent, etc.';


--
-- TOC entry 5341 (class 0 OID 16625)
-- Dependencies: 221
-- Data for Name: RegistrationSessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."RegistrationSessions" (id, unique_id, session_token, status, expires_at, "createdAt", "updatedAt") VALUES ('ff58acc3-4af1-4f32-a086-3a2d55e48ded', 'CS-2024-001', 'fec246d3-6013-457f-8c9c-2b24f89bda7b', 'COMPLETED', '2026-01-11 04:07:12.455+05:30', '2026-01-11 03:52:12.456+05:30', '2026-01-11 03:53:06.693+05:30');
INSERT INTO public."RegistrationSessions" (id, unique_id, session_token, status, expires_at, "createdAt", "updatedAt") VALUES ('d21cdd73-8ac0-410c-8385-3a133c33b502', 'CS-2024-002', 'a28d3838-bf74-448a-bec1-4c40e37c05aa', 'PENDING', '2026-01-11 04:18:16.537+05:30', '2026-01-11 04:03:16.537+05:30', '2026-01-11 04:03:16.537+05:30');


--
-- TOC entry 5339 (class 0 OID 16567)
-- Dependencies: 219
-- Data for Name: UniqueIds; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."UniqueIds" (id, unique_id, student_name, student_email, is_used, status, generated_date, expiry_date, used_date, generated_by, "createdAt", "updatedAt", role) VALUES ('22eb8d3e-ee5e-4d23-be45-d5018b117d40', 'CS-2024-002', 'Seed User 2', NULL, false, 'ACTIVE', '2026-01-11 03:45:20.495+05:30', NULL, NULL, NULL, '2026-01-11 03:45:20.495+05:30', '2026-01-11 03:45:20.495+05:30', 3);
INSERT INTO public."UniqueIds" (id, unique_id, student_name, student_email, is_used, status, generated_date, expiry_date, used_date, generated_by, "createdAt", "updatedAt", role) VALUES ('5573dc17-222d-4c66-ad85-b5d0baea9822', 'CS-2024-003', NULL, NULL, false, 'INACTIVE', '2026-01-11 03:45:20.499+05:30', NULL, NULL, NULL, '2026-01-11 03:45:20.499+05:30', '2026-01-11 03:45:20.499+05:30', 3);
INSERT INTO public."UniqueIds" (id, unique_id, student_name, student_email, is_used, status, generated_date, expiry_date, used_date, generated_by, "createdAt", "updatedAt", role) VALUES ('879cf3e7-3d1c-4aab-bc1a-a7c917edb20f', 'CS-2024-004', NULL, NULL, true, 'ACTIVE', '2026-01-11 03:45:20.501+05:30', NULL, NULL, NULL, '2026-01-11 03:45:20.501+05:30', '2026-01-11 03:45:20.501+05:30', 3);
INSERT INTO public."UniqueIds" (id, unique_id, student_name, student_email, is_used, status, generated_date, expiry_date, used_date, generated_by, "createdAt", "updatedAt", role) VALUES ('6ba7eb21-f332-4044-865e-b40843ecd636', 'CS-2024-001', 'Seed User 1', NULL, true, 'ACTIVE', '2026-01-11 03:45:20.485+05:30', NULL, '2026-01-11 03:53:06.689+05:30', NULL, '2026-01-11 03:45:20.486+05:30', '2026-01-11 03:53:06.69+05:30', 3);


--
-- TOC entry 5340 (class 0 OID 16589)
-- Dependencies: 220
-- Data for Name: Users; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Users" (id, unique_id, department_id, program_id, current_semester, username, email, password_hash, full_name, college_roll_number, role, registered_date, email_verified, is_active, "createdAt", "updatedAt", otp, otp_expires_at, dob) VALUES ('f9cd7bbb-a135-4115-b7f9-d64669bacf1b', 'CS-2024-001', NULL, NULL, NULL, 'Kapil_Dev', 'kapilupadhyaya9957@gmail.com', '$2b$10$My4u4cet668JbqJB6v/D8ujrvC3GuF4BajXErLnVIs4lGBZdoPMea', 'Kapil Upadhyaya', NULL, 3, '2026-01-11 03:53:06.683+05:30', false, true, '2026-01-11 03:53:06.683+05:30', '2026-01-23 19:54:54.761+05:30', NULL, NULL, '2004-04-17');


--
-- TOC entry 5344 (class 0 OID 19685)
-- Dependencies: 224
-- Data for Name: exam_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5342 (class 0 OID 19630)
-- Dependencies: 222
-- Data for Name: exams; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5343 (class 0 OID 19653)
-- Dependencies: 223
-- Data for Name: questions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5345 (class 0 OID 19712)
-- Dependencies: 225
-- Data for Name: student_answers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5346 (class 0 OID 19743)
-- Dependencies: 226
-- Data for Name: violations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 5112 (class 2606 OID 16638)
-- Name: RegistrationSessions RegistrationSessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_pkey" PRIMARY KEY (id);


--
-- TOC entry 5114 (class 2606 OID 22669)
-- Name: RegistrationSessions RegistrationSessions_session_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key" UNIQUE (session_token);


--
-- TOC entry 5116 (class 2606 OID 22671)
-- Name: RegistrationSessions RegistrationSessions_session_token_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key1" UNIQUE (session_token);


--
-- TOC entry 5118 (class 2606 OID 22665)
-- Name: RegistrationSessions RegistrationSessions_session_token_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key10" UNIQUE (session_token);


--
-- TOC entry 5120 (class 2606 OID 22689)
-- Name: RegistrationSessions RegistrationSessions_session_token_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key11" UNIQUE (session_token);


--
-- TOC entry 5122 (class 2606 OID 22663)
-- Name: RegistrationSessions RegistrationSessions_session_token_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key12" UNIQUE (session_token);


--
-- TOC entry 5124 (class 2606 OID 22677)
-- Name: RegistrationSessions RegistrationSessions_session_token_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key13" UNIQUE (session_token);


--
-- TOC entry 5126 (class 2606 OID 22691)
-- Name: RegistrationSessions RegistrationSessions_session_token_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key14" UNIQUE (session_token);


--
-- TOC entry 5128 (class 2606 OID 22693)
-- Name: RegistrationSessions RegistrationSessions_session_token_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key15" UNIQUE (session_token);


--
-- TOC entry 5130 (class 2606 OID 22695)
-- Name: RegistrationSessions RegistrationSessions_session_token_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key16" UNIQUE (session_token);


--
-- TOC entry 5132 (class 2606 OID 22697)
-- Name: RegistrationSessions RegistrationSessions_session_token_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key17" UNIQUE (session_token);


--
-- TOC entry 5134 (class 2606 OID 22661)
-- Name: RegistrationSessions RegistrationSessions_session_token_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key18" UNIQUE (session_token);


--
-- TOC entry 5136 (class 2606 OID 22699)
-- Name: RegistrationSessions RegistrationSessions_session_token_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key19" UNIQUE (session_token);


--
-- TOC entry 5138 (class 2606 OID 22673)
-- Name: RegistrationSessions RegistrationSessions_session_token_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key2" UNIQUE (session_token);


--
-- TOC entry 5140 (class 2606 OID 22659)
-- Name: RegistrationSessions RegistrationSessions_session_token_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key20" UNIQUE (session_token);


--
-- TOC entry 5142 (class 2606 OID 22657)
-- Name: RegistrationSessions RegistrationSessions_session_token_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key21" UNIQUE (session_token);


--
-- TOC entry 5144 (class 2606 OID 22701)
-- Name: RegistrationSessions RegistrationSessions_session_token_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key22" UNIQUE (session_token);


--
-- TOC entry 5146 (class 2606 OID 22655)
-- Name: RegistrationSessions RegistrationSessions_session_token_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key23" UNIQUE (session_token);


--
-- TOC entry 5148 (class 2606 OID 22703)
-- Name: RegistrationSessions RegistrationSessions_session_token_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key24" UNIQUE (session_token);


--
-- TOC entry 5150 (class 2606 OID 22705)
-- Name: RegistrationSessions RegistrationSessions_session_token_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key25" UNIQUE (session_token);


--
-- TOC entry 5152 (class 2606 OID 22707)
-- Name: RegistrationSessions RegistrationSessions_session_token_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key26" UNIQUE (session_token);


--
-- TOC entry 5154 (class 2606 OID 22709)
-- Name: RegistrationSessions RegistrationSessions_session_token_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key27" UNIQUE (session_token);


--
-- TOC entry 5156 (class 2606 OID 22711)
-- Name: RegistrationSessions RegistrationSessions_session_token_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key28" UNIQUE (session_token);


--
-- TOC entry 5158 (class 2606 OID 22653)
-- Name: RegistrationSessions RegistrationSessions_session_token_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key29" UNIQUE (session_token);


--
-- TOC entry 5160 (class 2606 OID 22675)
-- Name: RegistrationSessions RegistrationSessions_session_token_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key3" UNIQUE (session_token);


--
-- TOC entry 5162 (class 2606 OID 22713)
-- Name: RegistrationSessions RegistrationSessions_session_token_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key30" UNIQUE (session_token);


--
-- TOC entry 5164 (class 2606 OID 22679)
-- Name: RegistrationSessions RegistrationSessions_session_token_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key4" UNIQUE (session_token);


--
-- TOC entry 5166 (class 2606 OID 22667)
-- Name: RegistrationSessions RegistrationSessions_session_token_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key5" UNIQUE (session_token);


--
-- TOC entry 5168 (class 2606 OID 22681)
-- Name: RegistrationSessions RegistrationSessions_session_token_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key6" UNIQUE (session_token);


--
-- TOC entry 5170 (class 2606 OID 22683)
-- Name: RegistrationSessions RegistrationSessions_session_token_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key7" UNIQUE (session_token);


--
-- TOC entry 5172 (class 2606 OID 22685)
-- Name: RegistrationSessions RegistrationSessions_session_token_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key8" UNIQUE (session_token);


--
-- TOC entry 5174 (class 2606 OID 22687)
-- Name: RegistrationSessions RegistrationSessions_session_token_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RegistrationSessions"
    ADD CONSTRAINT "RegistrationSessions_session_token_key9" UNIQUE (session_token);


--
-- TOC entry 4922 (class 2606 OID 16580)
-- Name: UniqueIds UniqueIds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_pkey" PRIMARY KEY (id);


--
-- TOC entry 4924 (class 2606 OID 22444)
-- Name: UniqueIds UniqueIds_unique_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key" UNIQUE (unique_id);


--
-- TOC entry 4926 (class 2606 OID 22446)
-- Name: UniqueIds UniqueIds_unique_id_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key1" UNIQUE (unique_id);


--
-- TOC entry 4928 (class 2606 OID 22440)
-- Name: UniqueIds UniqueIds_unique_id_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key10" UNIQUE (unique_id);


--
-- TOC entry 4930 (class 2606 OID 22462)
-- Name: UniqueIds UniqueIds_unique_id_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key11" UNIQUE (unique_id);


--
-- TOC entry 4932 (class 2606 OID 22464)
-- Name: UniqueIds UniqueIds_unique_id_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key12" UNIQUE (unique_id);


--
-- TOC entry 4934 (class 2606 OID 22438)
-- Name: UniqueIds UniqueIds_unique_id_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key13" UNIQUE (unique_id);


--
-- TOC entry 4936 (class 2606 OID 22466)
-- Name: UniqueIds UniqueIds_unique_id_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key14" UNIQUE (unique_id);


--
-- TOC entry 4938 (class 2606 OID 22468)
-- Name: UniqueIds UniqueIds_unique_id_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key15" UNIQUE (unique_id);


--
-- TOC entry 4940 (class 2606 OID 22470)
-- Name: UniqueIds UniqueIds_unique_id_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key16" UNIQUE (unique_id);


--
-- TOC entry 4942 (class 2606 OID 22472)
-- Name: UniqueIds UniqueIds_unique_id_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key17" UNIQUE (unique_id);


--
-- TOC entry 4944 (class 2606 OID 22436)
-- Name: UniqueIds UniqueIds_unique_id_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key18" UNIQUE (unique_id);


--
-- TOC entry 4946 (class 2606 OID 22474)
-- Name: UniqueIds UniqueIds_unique_id_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key19" UNIQUE (unique_id);


--
-- TOC entry 4948 (class 2606 OID 22448)
-- Name: UniqueIds UniqueIds_unique_id_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key2" UNIQUE (unique_id);


--
-- TOC entry 4950 (class 2606 OID 22476)
-- Name: UniqueIds UniqueIds_unique_id_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key20" UNIQUE (unique_id);


--
-- TOC entry 4952 (class 2606 OID 22434)
-- Name: UniqueIds UniqueIds_unique_id_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key21" UNIQUE (unique_id);


--
-- TOC entry 4954 (class 2606 OID 22478)
-- Name: UniqueIds UniqueIds_unique_id_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key22" UNIQUE (unique_id);


--
-- TOC entry 4956 (class 2606 OID 22432)
-- Name: UniqueIds UniqueIds_unique_id_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key23" UNIQUE (unique_id);


--
-- TOC entry 4958 (class 2606 OID 22480)
-- Name: UniqueIds UniqueIds_unique_id_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key24" UNIQUE (unique_id);


--
-- TOC entry 4960 (class 2606 OID 22430)
-- Name: UniqueIds UniqueIds_unique_id_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key25" UNIQUE (unique_id);


--
-- TOC entry 4962 (class 2606 OID 22482)
-- Name: UniqueIds UniqueIds_unique_id_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key26" UNIQUE (unique_id);


--
-- TOC entry 4964 (class 2606 OID 22484)
-- Name: UniqueIds UniqueIds_unique_id_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key27" UNIQUE (unique_id);


--
-- TOC entry 4966 (class 2606 OID 22486)
-- Name: UniqueIds UniqueIds_unique_id_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key28" UNIQUE (unique_id);


--
-- TOC entry 4968 (class 2606 OID 22428)
-- Name: UniqueIds UniqueIds_unique_id_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key29" UNIQUE (unique_id);


--
-- TOC entry 4970 (class 2606 OID 22450)
-- Name: UniqueIds UniqueIds_unique_id_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key3" UNIQUE (unique_id);


--
-- TOC entry 4972 (class 2606 OID 22426)
-- Name: UniqueIds UniqueIds_unique_id_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key30" UNIQUE (unique_id);


--
-- TOC entry 4974 (class 2606 OID 22452)
-- Name: UniqueIds UniqueIds_unique_id_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key4" UNIQUE (unique_id);


--
-- TOC entry 4976 (class 2606 OID 22442)
-- Name: UniqueIds UniqueIds_unique_id_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key5" UNIQUE (unique_id);


--
-- TOC entry 4978 (class 2606 OID 22454)
-- Name: UniqueIds UniqueIds_unique_id_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key6" UNIQUE (unique_id);


--
-- TOC entry 4980 (class 2606 OID 22456)
-- Name: UniqueIds UniqueIds_unique_id_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key7" UNIQUE (unique_id);


--
-- TOC entry 4982 (class 2606 OID 22458)
-- Name: UniqueIds UniqueIds_unique_id_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key8" UNIQUE (unique_id);


--
-- TOC entry 4984 (class 2606 OID 22460)
-- Name: UniqueIds UniqueIds_unique_id_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UniqueIds"
    ADD CONSTRAINT "UniqueIds_unique_id_key9" UNIQUE (unique_id);


--
-- TOC entry 4986 (class 2606 OID 22596)
-- Name: Users Users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key" UNIQUE (email);


--
-- TOC entry 4988 (class 2606 OID 22598)
-- Name: Users Users_email_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key1" UNIQUE (email);


--
-- TOC entry 4990 (class 2606 OID 22592)
-- Name: Users Users_email_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key10" UNIQUE (email);


--
-- TOC entry 4992 (class 2606 OID 22616)
-- Name: Users Users_email_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key11" UNIQUE (email);


--
-- TOC entry 4994 (class 2606 OID 22590)
-- Name: Users Users_email_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key12" UNIQUE (email);


--
-- TOC entry 4996 (class 2606 OID 22618)
-- Name: Users Users_email_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key13" UNIQUE (email);


--
-- TOC entry 4998 (class 2606 OID 22620)
-- Name: Users Users_email_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key14" UNIQUE (email);


--
-- TOC entry 5000 (class 2606 OID 22622)
-- Name: Users Users_email_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key15" UNIQUE (email);


--
-- TOC entry 5002 (class 2606 OID 22624)
-- Name: Users Users_email_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key16" UNIQUE (email);


--
-- TOC entry 5004 (class 2606 OID 22626)
-- Name: Users Users_email_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key17" UNIQUE (email);


--
-- TOC entry 5006 (class 2606 OID 22588)
-- Name: Users Users_email_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key18" UNIQUE (email);


--
-- TOC entry 5008 (class 2606 OID 22578)
-- Name: Users Users_email_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key19" UNIQUE (email);


--
-- TOC entry 5010 (class 2606 OID 22600)
-- Name: Users Users_email_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key2" UNIQUE (email);


--
-- TOC entry 5012 (class 2606 OID 22586)
-- Name: Users Users_email_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key20" UNIQUE (email);


--
-- TOC entry 5014 (class 2606 OID 22614)
-- Name: Users Users_email_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key21" UNIQUE (email);


--
-- TOC entry 5016 (class 2606 OID 22580)
-- Name: Users Users_email_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key22" UNIQUE (email);


--
-- TOC entry 5018 (class 2606 OID 22584)
-- Name: Users Users_email_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key23" UNIQUE (email);


--
-- TOC entry 5020 (class 2606 OID 22582)
-- Name: Users Users_email_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key24" UNIQUE (email);


--
-- TOC entry 5022 (class 2606 OID 22628)
-- Name: Users Users_email_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key25" UNIQUE (email);


--
-- TOC entry 5024 (class 2606 OID 22630)
-- Name: Users Users_email_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key26" UNIQUE (email);


--
-- TOC entry 5026 (class 2606 OID 22632)
-- Name: Users Users_email_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key27" UNIQUE (email);


--
-- TOC entry 5028 (class 2606 OID 22634)
-- Name: Users Users_email_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key28" UNIQUE (email);


--
-- TOC entry 5030 (class 2606 OID 22576)
-- Name: Users Users_email_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key29" UNIQUE (email);


--
-- TOC entry 5032 (class 2606 OID 22602)
-- Name: Users Users_email_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key3" UNIQUE (email);


--
-- TOC entry 5034 (class 2606 OID 22636)
-- Name: Users Users_email_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key30" UNIQUE (email);


--
-- TOC entry 5036 (class 2606 OID 22604)
-- Name: Users Users_email_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key4" UNIQUE (email);


--
-- TOC entry 5038 (class 2606 OID 22594)
-- Name: Users Users_email_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key5" UNIQUE (email);


--
-- TOC entry 5040 (class 2606 OID 22606)
-- Name: Users Users_email_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key6" UNIQUE (email);


--
-- TOC entry 5042 (class 2606 OID 22608)
-- Name: Users Users_email_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key7" UNIQUE (email);


--
-- TOC entry 5044 (class 2606 OID 22610)
-- Name: Users Users_email_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key8" UNIQUE (email);


--
-- TOC entry 5046 (class 2606 OID 22612)
-- Name: Users Users_email_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_email_key9" UNIQUE (email);


--
-- TOC entry 5048 (class 2606 OID 16607)
-- Name: Users Users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


--
-- TOC entry 5050 (class 2606 OID 22529)
-- Name: Users Users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key" UNIQUE (username);


--
-- TOC entry 5052 (class 2606 OID 22531)
-- Name: Users Users_username_key1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key1" UNIQUE (username);


--
-- TOC entry 5054 (class 2606 OID 22523)
-- Name: Users Users_username_key10; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key10" UNIQUE (username);


--
-- TOC entry 5056 (class 2606 OID 22545)
-- Name: Users Users_username_key11; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key11" UNIQUE (username);


--
-- TOC entry 5058 (class 2606 OID 22521)
-- Name: Users Users_username_key12; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key12" UNIQUE (username);


--
-- TOC entry 5060 (class 2606 OID 22519)
-- Name: Users Users_username_key13; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key13" UNIQUE (username);


--
-- TOC entry 5062 (class 2606 OID 22547)
-- Name: Users Users_username_key14; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key14" UNIQUE (username);


--
-- TOC entry 5064 (class 2606 OID 22549)
-- Name: Users Users_username_key15; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key15" UNIQUE (username);


--
-- TOC entry 5066 (class 2606 OID 22551)
-- Name: Users Users_username_key16; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key16" UNIQUE (username);


--
-- TOC entry 5068 (class 2606 OID 22553)
-- Name: Users Users_username_key17; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key17" UNIQUE (username);


--
-- TOC entry 5070 (class 2606 OID 22517)
-- Name: Users Users_username_key18; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key18" UNIQUE (username);


--
-- TOC entry 5072 (class 2606 OID 22555)
-- Name: Users Users_username_key19; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key19" UNIQUE (username);


--
-- TOC entry 5074 (class 2606 OID 22533)
-- Name: Users Users_username_key2; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key2" UNIQUE (username);


--
-- TOC entry 5076 (class 2606 OID 22515)
-- Name: Users Users_username_key20; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key20" UNIQUE (username);


--
-- TOC entry 5078 (class 2606 OID 22557)
-- Name: Users Users_username_key21; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key21" UNIQUE (username);


--
-- TOC entry 5080 (class 2606 OID 22559)
-- Name: Users Users_username_key22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key22" UNIQUE (username);


--
-- TOC entry 5082 (class 2606 OID 22513)
-- Name: Users Users_username_key23; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key23" UNIQUE (username);


--
-- TOC entry 5084 (class 2606 OID 22561)
-- Name: Users Users_username_key24; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key24" UNIQUE (username);


--
-- TOC entry 5086 (class 2606 OID 22563)
-- Name: Users Users_username_key25; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key25" UNIQUE (username);


--
-- TOC entry 5088 (class 2606 OID 22565)
-- Name: Users Users_username_key26; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key26" UNIQUE (username);


--
-- TOC entry 5090 (class 2606 OID 22567)
-- Name: Users Users_username_key27; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key27" UNIQUE (username);


--
-- TOC entry 5092 (class 2606 OID 22569)
-- Name: Users Users_username_key28; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key28" UNIQUE (username);


--
-- TOC entry 5094 (class 2606 OID 22511)
-- Name: Users Users_username_key29; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key29" UNIQUE (username);


--
-- TOC entry 5096 (class 2606 OID 22535)
-- Name: Users Users_username_key3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key3" UNIQUE (username);


--
-- TOC entry 5098 (class 2606 OID 22571)
-- Name: Users Users_username_key30; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key30" UNIQUE (username);


--
-- TOC entry 5100 (class 2606 OID 22537)
-- Name: Users Users_username_key4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key4" UNIQUE (username);


--
-- TOC entry 5102 (class 2606 OID 22527)
-- Name: Users Users_username_key5; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key5" UNIQUE (username);


--
-- TOC entry 5104 (class 2606 OID 22525)
-- Name: Users Users_username_key6; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key6" UNIQUE (username);


--
-- TOC entry 5106 (class 2606 OID 22539)
-- Name: Users Users_username_key7; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key7" UNIQUE (username);


--
-- TOC entry 5108 (class 2606 OID 22541)
-- Name: Users Users_username_key8; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key8" UNIQUE (username);


--
-- TOC entry 5110 (class 2606 OID 22543)
-- Name: Users Users_username_key9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_username_key9" UNIQUE (username);


--
-- TOC entry 5180 (class 2606 OID 19701)
-- Name: exam_attempts exam_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT exam_attempts_pkey PRIMARY KEY (id);


--
-- TOC entry 5176 (class 2606 OID 19647)
-- Name: exams exams_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exams
    ADD CONSTRAINT exams_pkey PRIMARY KEY (id);


--
-- TOC entry 5178 (class 2606 OID 19669)
-- Name: questions questions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_pkey PRIMARY KEY (id);


--
-- TOC entry 5182 (class 2606 OID 19722)
-- Name: student_answers student_answers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT student_answers_pkey PRIMARY KEY (id);


--
-- TOC entry 5184 (class 2606 OID 19754)
-- Name: violations violations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_pkey PRIMARY KEY (id);


--
-- TOC entry 5185 (class 2606 OID 22503)
-- Name: Users Users_unique_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Users"
    ADD CONSTRAINT "Users_unique_id_fkey" FOREIGN KEY (unique_id) REFERENCES public."UniqueIds"(unique_id);


--
-- TOC entry 5187 (class 2606 OID 22754)
-- Name: exam_attempts exam_attempts_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT exam_attempts_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5188 (class 2606 OID 22749)
-- Name: exam_attempts exam_attempts_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam_attempts
    ADD CONSTRAINT exam_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES public."Users"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5186 (class 2606 OID 22734)
-- Name: questions questions_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.questions
    ADD CONSTRAINT questions_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exams(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5189 (class 2606 OID 22769)
-- Name: student_answers student_answers_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT student_answers_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5190 (class 2606 OID 22774)
-- Name: student_answers student_answers_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_answers
    ADD CONSTRAINT student_answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- TOC entry 5191 (class 2606 OID 22783)
-- Name: violations violations_attempt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.violations
    ADD CONSTRAINT violations_attempt_id_fkey FOREIGN KEY (attempt_id) REFERENCES public.exam_attempts(id) ON UPDATE CASCADE ON DELETE CASCADE;


-- Completed on 2026-01-23 20:03:04

--
-- PostgreSQL database dump complete
--



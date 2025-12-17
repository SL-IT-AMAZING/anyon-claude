---
document_type: Entity Relationship Diagram (ERD)
project_name: {{project_name}}
created_date: {{date}}
author: {{user_name}}
based_on_documents:
  - prd.md
  - ux-design.md
  - ui-design-guide.md
  - trd.md
  - architecture.md

# Quick Reference - 빠른 검색을 위한 메타데이터
service_type: {{service_type}}
platform: {{platform}}
database_type: {{database_type}}

tables:
{{tables_list}}

relationships:
{{relationships_list}}

key_indexes:
{{indexes_list}}
---

# {{project_name}} - Entity Relationship Diagram (ERD)

**작성일**: {{date}}
**작성자**: {{user_name}}
**기반 문서**: PRD, UX Design, UI Design Guide, TRD, Architecture

---

## 📋 문서 개요

이 문서는 {{project_name}}의 데이터베이스 스키마를 상세히 정의합니다. 모든 테이블, 필드, 관계, 인덱스, 제약조건을 명시하여 개발자가 바로 구현할 수 있도록 합니다.

**비개발자를 위한 설명:**
{{non_technical_explanation}}

**참조 정보:**
- 서비스 유형: {{service_type}}
- 데이터베이스: {{database_type}}
- 테이블 수: {{table_count}}개

---

## 🔍 유사 서비스 ERD 분석

{{similar_services_erd_analysis}}

---

## 🎯 데이터베이스 설계 원칙

{{database_design_principles}}

---

## 📊 ERD 다이어그램

### 전체 ERD 개요
{{erd_diagram}}

### 비개발자를 위한 설명
{{erd_explanation_for_non_tech}}

---

## 📦 테이블 상세 정의

{{all_tables_detailed}}

---

## 🔗 테이블 관계 (Relationships)

{{table_relationships}}

---

## 🔑 인덱스 전략

{{indexes_strategy}}

---

## 🔒 제약조건 (Constraints)

{{constraints}}

---

## 📈 데이터 타입 및 크기

{{data_types_and_sizes}}

---

## 🔄 Migration 전략

{{migration_strategy}}

---

## 💾 샘플 데이터

{{sample_data}}

---

## 📊 예상 데이터 볼륨

{{estimated_data_volume}}

---

## 🚀 확장성 고려사항

{{scalability_considerations}}

---

## 🔐 데이터 보안

{{data_security}}

---

## 🧪 테스트 데이터 시나리오

{{test_data_scenarios}}

---

## 🔄 다음 단계

이 ERD 문서를 기반으로 다음을 진행할 수 있습니다:

1. **Database Migration Files** - 실제 마이그레이션 파일 생성
2. **ORM Models** - 백엔드 프레임워크의 모델 코드 생성
3. **API Implementation** - ERD 기반 API 엔드포인트 구현
4. **Seed Data** - 개발용 시드 데이터 생성

---

**문서 버전**: 1.0
**최종 수정일**: {{date}}

---

## 🎉 Startup Launchpad 완료!

모든 6개 문서가 완성되었습니다:

1. ✅ **PRD** (Product Requirements Document) - 제품 요구사항
2. ✅ **UX Design** - 사용자 경험 설계
3. ✅ **UI Design Guide** - UI 디자인 시스템
4. ✅ **TRD** (Technical Requirements Document) - 기술 스택
5. ✅ **Architecture** - 시스템 아키텍처
6. ✅ **ERD** (Entity Relationship Diagram) - 데이터베이스 설계

**이제 개발을 시작할 수 있습니다!** 🚀
